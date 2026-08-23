/**
 * Merge-tag substitution for campaign bodies.
 *
 * Single source of truth for which `{{tokens}}` exist, shared by the worker and
 * the test-email preview so a test never renders differently from the real send.
 *
 * Matching is deliberately forgiving, because the tag is typed by hand into a
 * rich-text editor: case-insensitive and whitespace-tolerant, so `{{fullName}}`,
 * `{{fullname}}` and `{{ Full Name }}` all resolve. An unknown tag is left
 * untouched rather than blanked — a visible `{{whatever}}` in a test send is a
 * bug report; a silently empty sentence is not.
 */

export interface PersonalizationVars {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
}

/** Canonical token name → resolved value. Keys are compared lowercased. */
function buildTokenMap(vars: PersonalizationVars): Record<string, string> {
    const firstName = (vars.firstName || "").trim();
    const lastName = (vars.lastName || "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    // "there" keeps "Hi {{firstName}}," readable for contacts imported with no
    // name at all, which is most WhatsApp-only and bare-email imports.
    const greeting = firstName || "there";

    return {
        firstname: greeting,
        lastname: lastName,
        fullname: fullName || greeting,
        // Aliases people reach for without checking the docs.
        name: fullName || greeting,
        email: (vars.email || "").trim(),
    };
}

/** Tokens offered in the editor's variable menu. */
export const PERSONALIZATION_TOKENS = [
    { token: "{{fullName}}", label: "Full name", example: "Anuj Kumar" },
    { token: "{{firstName}}", label: "First name", example: "Anuj" },
    { token: "{{lastName}}", label: "Last name", example: "Kumar" },
    { token: "{{email}}", label: "Email address", example: "anuj@example.com" },
] as const;

export function applyPersonalization(html: string, vars: PersonalizationVars): string {
    const tokens = buildTokenMap(vars);

    return html.replace(/\{\{\s*([a-zA-Z_ ]+?)\s*\}\}/g, (match, rawName: string) => {
        const key = rawName.toLowerCase().replace(/[\s_]/g, "");
        return key in tokens ? tokens[key] : match;
    });
}
