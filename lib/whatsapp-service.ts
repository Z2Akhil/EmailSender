import { decrypt } from "./crypto";

/**
 * Converts the template DEFINITION components (as returned by Meta's
 * message_templates endpoint and stored at sync time) into the PARAMETER
 * components the send API expects. They are different shapes: the definition
 * describes the layout ("Hello {{1}}"), while the send payload must supply a
 * value for each numbered placeholder.
 *
 * Convention: {{1}} is filled with the recipient's first name; any further
 * placeholders are filled with "-" since we have no per-campaign variable
 * mapping (yet). Templates without placeholders send with no components.
 */
export function buildTemplateComponents(
    definition: any[] | undefined,
    vars: { name: string }
): any[] {
    if (!definition?.length) return [];

    const maxPlaceholder = (text?: string) => {
        const matches = String(text || "").match(/\{\{\s*(\d+)\s*\}\}/g) || [];
        return matches.reduce((max, m) => Math.max(max, parseInt(m.replace(/\D/g, ""), 10) || 0), 0);
    };

    const components: any[] = [];

    for (const comp of definition) {
        const type = String(comp?.type || "").toUpperCase();

        if (type === "BODY") {
            const count = maxPlaceholder(comp.text);
            if (count > 0) {
                components.push({
                    type: "body",
                    parameters: Array.from({ length: count }, (_, i) => ({
                        type: "text",
                        text: i === 0 ? vars.name : "-",
                    })),
                });
            }
        } else if (type === "HEADER") {
            // Only TEXT headers can be parameterized this way; media headers
            // (IMAGE/VIDEO/DOCUMENT) need media params we don't support yet.
            const format = String(comp.format || "TEXT").toUpperCase();
            if (format !== "TEXT") continue;
            const count = maxPlaceholder(comp.text);
            if (count > 0) {
                components.push({
                    type: "header",
                    parameters: Array.from({ length: count }, (_, i) => ({
                        type: "text",
                        text: i === 0 ? vars.name : "-",
                    })),
                });
            }
        }
    }

    return components;
}

export interface WhatsappMessageParams {
    to: string;
    templateName: string;
    languageCode: string;
    components?: any[];
    accessToken: string;
    phoneNumberId: string;
}

export const sendWhatsappMessage = async ({
    to,
    templateName,
    languageCode,
    components,
    accessToken,
    phoneNumberId
}: WhatsappMessageParams) => {
    const token = decrypt(accessToken);

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/[^0-9]/g, ""), // Ensure purely numeric E.164
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
            components: components || []
        }
    };

    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(`WhatsApp API Error: ${data.error?.message || JSON.stringify(data.error)}`);
    }

    // Returns array of sent messages with ids: data.messages[0].id
    return data;
};
