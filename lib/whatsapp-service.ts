import { decrypt } from "./crypto";

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
