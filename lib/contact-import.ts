/**
 * Canonical contact import format — shared by the upload UI, the import API
 * route and the manual "add contact" form so that every path produces
 * identically shaped contacts.
 *
 * A contact is reachable on a channel when:
 *   - EMAIL    → `email` is present and syntactically valid
 *   - WHATSAPP → `whatsappNumber` is present (E.164) and `whatsappOptIn` is true
 *
 * A row only needs ONE of the two to be importable, so the same file can seed
 * an email-only list, a WhatsApp-only list, or a mixed list.
 *
 * Storage conventions (do not change without a data migration):
 *   - `email`          lowercased, trimmed
 *   - `whatsappNumber` E.164 digits WITHOUT the leading "+" (what the Meta
 *                      Graph API expects, and what pre-existing rows contain)
 *   - `phone`          E.164 WITH the leading "+" for display; falls back to
 *                      the raw trimmed value when it cannot be parsed
 */

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Canonical fields ─────────────────────────────────────────────────────────

/**
 * The whole contact schema, as far as the application is concerned: a name, an
 * email, a phone number and a WhatsApp number. Nothing else is importable,
 * addable or displayed — keep this list and the "add contact" form in step.
 */
export type CanonicalField = "fullName" | "email" | "phone" | "whatsappNumber";

export type ChannelGroup = "identity" | "email" | "whatsapp";

export interface FieldDescriptor {
    key: CanonicalField;
    label: string;
    hint?: string;
    group: ChannelGroup;
    /** Lowercased header names that map onto this field automatically. */
    aliases: string[];
}

/**
 * Order matters: this is the order shown in the mapping UI and the column order
 * of the downloadable template.
 */
export const CONTACT_IMPORT_FIELDS: FieldDescriptor[] = [
    {
        key: "fullName",
        label: "Full name",
        hint: "Split on the first space for {{firstName}} in emails and WhatsApp templates",
        group: "identity",
        aliases: [
            "name", "full name", "fullname", "full_name", "contact name", "display name",
            "firstname", "first name", "first_name", "given name", "givenname", "fname",
        ],
    },
    {
        key: "email",
        label: "Email",
        hint: "Required for email campaigns",
        group: "email",
        aliases: ["email", "e-mail", "email address", "emailaddress", "email_address", "mail", "e mail"],
    },
    {
        key: "phone",
        label: "Phone",
        hint: "Stored for reference only — not used for sending",
        group: "identity",
        aliases: ["phone", "phone number", "phonenumber", "phone_number", "number", "tel", "telephone", "contact", "contact number"],
    },
    {
        key: "whatsappNumber",
        label: "WhatsApp number",
        hint: "Required for WhatsApp campaigns — include the country code",
        group: "whatsapp",
        aliases: [
            "whatsapp", "whatsapp number", "whatsappnumber", "whatsapp_number",
            "wa", "wa number", "wanumber", "whatsapp no", "mobile", "mobile number",
            "cell", "cellphone", "msisdn",
        ],
    },
];

/** Column header (from the user's file) chosen for each canonical field. */
export type ColumnMapping = Partial<Record<CanonicalField, string>>;

/**
 * Legacy mapping keys still accepted by the import API:
 *   `name`, `firstName` → fullName
 *   `number`            → whatsappNumber + phone
 *
 * Anything else (`lastName`, `company`, `whatsappOptIn`, …) is dropped — those
 * fields no longer exist on a contact.
 */
export interface LegacyColumnMapping extends ColumnMapping {
    name?: string;
    firstName?: string;
    number?: string;
    [key: string]: string | undefined;
}

const CANONICAL_KEYS = new Set<string>(CONTACT_IMPORT_FIELDS.map((f) => f.key));

export function normalizeMapping(raw: LegacyColumnMapping): ColumnMapping {
    const mapping: ColumnMapping = {};
    for (const [key, value] of Object.entries(raw)) {
        if (value && CANONICAL_KEYS.has(key)) mapping[key as CanonicalField] = value;
    }
    const legacyName = raw.name || raw.firstName;
    if (legacyName && !mapping.fullName) mapping.fullName = legacyName;
    if (raw.number) {
        if (!mapping.whatsappNumber) mapping.whatsappNumber = raw.number;
        if (!mapping.phone) mapping.phone = raw.number;
    }
    return mapping;
}

// ─── Auto-mapping ─────────────────────────────────────────────────────────────

const canon = (s: string) => s.toLowerCase().trim().replace(/[\s_\-.]+/g, " ");

/**
 * Best-effort match of the file's headers onto canonical fields. Exact alias
 * matches win over substring matches, and each header is only used once.
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};
    const taken = new Set<string>();
    const normalized = headers.map((h) => ({ header: h, key: canon(h) }));

    const claim = (field: CanonicalField, match: (key: string) => boolean) => {
        if (mapping[field]) return;
        const hit = normalized.find((h) => !taken.has(h.header) && match(h.key));
        if (hit) {
            mapping[field] = hit.header;
            taken.add(hit.header);
        }
    };

    // Pass 1 — exact alias match.
    for (const field of CONTACT_IMPORT_FIELDS) {
        claim(field.key, (key) => field.aliases.includes(key));
    }
    // Pass 2 — header contains an alias (e.g. "Primary Email Address").
    for (const field of CONTACT_IMPORT_FIELDS) {
        claim(field.key, (key) => field.aliases.some((a) => a.length > 2 && key.includes(a)));
    }

    // One number column serves both fields — whichever of the two it landed on.
    if (!mapping.whatsappNumber && mapping.phone) {
        mapping.whatsappNumber = mapping.phone;
    } else if (!mapping.phone && mapping.whatsappNumber) {
        mapping.phone = mapping.whatsappNumber;
    }
    return mapping;
}

// ─── Value normalizers ────────────────────────────────────────────────────────

export function normalizeEmail(raw: unknown): { email?: string; error?: string } {
    const value = raw == null ? "" : String(raw).trim().toLowerCase();
    if (!value) return {};
    if (!EMAIL_REGEX.test(value)) return { error: `Invalid email "${value}"` };
    return { email: value };
}

export interface PhoneResult {
    /** E.164 digits without "+", the storage form for `whatsappNumber`. */
    digits?: string;
    /** E.164 with "+", the storage form for `phone`. */
    e164?: string;
    error?: string;
}

/**
 * Parse a phone number into E.164.
 *
 * Numbers written with "+" or "00" are treated as international regardless of
 * `defaultCountry`. Bare national numbers ("09876543210") use `defaultCountry`
 * to resolve the calling code and drop the trunk prefix. Digit strings that
 * already carry a calling code ("917667470379") still parse when no default
 * country is supplied.
 */
export function normalizePhone(raw: unknown, defaultCountry?: CountryCode): PhoneResult {
    const value = raw == null ? "" : String(raw).trim();
    if (!value) return {};

    // Spreadsheets love turning numbers into 9.1766747038e+11 — reject rather
    // than silently store a mangled value.
    if (/e\+?\d+$/i.test(value.replace(/\s/g, ""))) {
        return { error: `"${value}" looks like a number formatted by Excel — format the column as text` };
    }

    let cleaned = value.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;

    // Each attempt is [text handed to the parser, country hint]. A bare digit
    // string is tried nationally first (trunk prefix dropped via the country
    // hint) and then as an international number that already carries its
    // calling code.
    const attempts: [string, CountryCode | undefined][] = cleaned.startsWith("+")
        ? [[cleaned, undefined]]
        : [
            ...(defaultCountry ? ([[cleaned, defaultCountry]] as [string, CountryCode][]) : []),
            [`+${cleaned}`, undefined],
        ];

    for (const [candidate, country] of attempts) {
        const parsed = parsePhoneNumberFromString(candidate, country);
        if (parsed?.isValid()) {
            const e164 = parsed.number;
            return { e164, digits: e164.replace(/\D/g, "") };
        }
    }

    return { error: `"${value}" is not a valid phone number${defaultCountry ? "" : " — pick a default country or include the country code"}` };
}

// ─── Row normalization ────────────────────────────────────────────────────────

/**
 * Storage shape. `fullName` is split into `firstName`/`lastName` because
 * `{{firstName}}` personalization reads them; the UI only ever shows the two
 * joined back together.
 */
export interface NormalizedContact {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    whatsappNumber?: string;
    whatsappOptIn: boolean;
}

/** "Alice van der Berg" → { firstName: "Alice", lastName: "van der Berg" } */
export function splitFullName(fullName?: string): { firstName?: string; lastName?: string } {
    const value = fullName?.trim();
    if (!value) return {};
    const parts = value.split(/\s+/);
    return {
        firstName: parts[0],
        lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
    };
}

/** Inverse of `splitFullName`, for display and export. */
export function joinFullName(c: Pick<NormalizedContact, "firstName" | "lastName">): string {
    return [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export interface NormalizeOptions {
    /** ISO-3166 alpha-2 used to resolve numbers written without a country code. */
    defaultCountry?: CountryCode;
    /**
     * Consent for every WhatsApp number in the file. Importing a number is the
     * list owner asserting consent; without the flag every WhatsApp send skips
     * the contact.
     */
    whatsappOptInDefault?: boolean;
}

export interface RowResult {
    contact?: NormalizedContact;
    /** Hard failure — the row is not importable. */
    error?: string;
    /** Non-fatal problems (e.g. bad phone but a usable email). */
    warnings: string[];
}

export function normalizeRow(
    row: Record<string, unknown>,
    mapping: ColumnMapping,
    options: NormalizeOptions = {}
): RowResult {
    const { defaultCountry, whatsappOptInDefault = true } = options;
    const warnings: string[] = [];

    const cell = (field: CanonicalField): unknown => {
        const column = mapping[field];
        return column ? row[column] : undefined;
    };
    const text = (field: CanonicalField): string | undefined => {
        const value = cell(field);
        const str = value == null ? "" : String(value).trim();
        return str || undefined;
    };

    const { firstName, lastName } = splitFullName(text("fullName"));

    const { email, error: emailError } = normalizeEmail(cell("email"));
    if (emailError) warnings.push(emailError);

    const whatsapp = normalizePhone(cell("whatsappNumber"), defaultCountry);
    if (whatsapp.error) warnings.push(whatsapp.error);

    // `phone` is reference data — keep whatever the user typed if unparseable.
    const phoneRaw = text("phone");
    const phone = normalizePhone(phoneRaw, defaultCountry);

    const whatsappOptIn = whatsapp.digits ? whatsappOptInDefault : false;

    if (!email && !whatsapp.digits) {
        return {
            error: emailError || whatsapp.error || "Row has neither a valid email nor a valid WhatsApp number",
            warnings,
        };
    }

    return {
        contact: {
            email,
            firstName,
            lastName,
            phone: phone.e164 || phoneRaw,
            whatsappNumber: whatsapp.digits,
            whatsappOptIn,
        },
        warnings,
    };
}

/** Dedupe key: email first, WhatsApp number for email-less contacts. */
export function contactKey(contact: Pick<NormalizedContact, "email" | "whatsappNumber">): string {
    return contact.email ? `e:${contact.email}` : `w:${contact.whatsappNumber}`;
}

export function isEmailReady(c: Pick<NormalizedContact, "email">): boolean {
    return !!c.email;
}

export function isWhatsappReady(c: Pick<NormalizedContact, "whatsappNumber" | "whatsappOptIn">): boolean {
    return !!c.whatsappNumber && !!c.whatsappOptIn;
}

// ─── Downloadable template ────────────────────────────────────────────────────

/**
 * One column per canonical field — the four things a contact can hold. A file
 * may omit any of them; only email or WhatsApp is strictly needed.
 *
 * WhatsApp consent comes from the checkbox on the upload screen, so there is no
 * opt-in column.
 */
export const TEMPLATE_COLUMNS = ["name", "email", "phone", "whatsapp"] as const;

/**
 * Example rows covering all three shapes a contact can take: email-only,
 * WhatsApp-only, and both. These parse cleanly through `normalizeRow` with no
 * default country, so the downloaded file imports as-is — it is a working
 * example, not decoration.
 */
export const TEMPLATE_ROWS: string[][] = [
    ["Alice Sharma", "alice@example.com", "919876543210", "919876543210"],
    ["Bob Mensah", "bob@example.com", "", ""],
    ["Chidi Okeke", "", "", "2348012345678"],
];

/** Header row + examples, as a grid — the source for every export format. */
export const TEMPLATE_GRID: string[][] = [[...TEMPLATE_COLUMNS], ...TEMPLATE_ROWS];

function csvEscape(value: string): string {
    // Leading "+" or "=" makes Excel treat a CSV cell as a formula; quoting it
    // and prefixing a tab keeps long numbers as text instead of 9.19E+11.
    const needsQuotes = /[",\r\n]/.test(value) || /^[+=@-]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

/**
 * The "standard format" users download, fill in and upload as-is.
 *
 * CRLF line endings and a UTF-8 BOM (added at download time) so Excel opens it
 * with the right encoding.
 */
export const SAMPLE_CSV = TEMPLATE_GRID.map((row) => row.map(csvEscape).join(",")).join("\r\n");
