import https from "https";

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

interface WhatsAppMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text" | "image" | "document";
  text?: {
    body: string;
    preview_url?: boolean;
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
  };
}

interface SendMessageResponse {
  messaging_product: "whatsapp";
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string | WhatsAppMessage
): Promise<SendMessageResponse | null> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp API credentials not configured");
    return null;
  }

  const messagePayload: WhatsAppMessage =
    typeof message === "string"
      ? {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }
      : message;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send WhatsApp message:", {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    return (await response.json()) as SendMessageResponse;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return null;
  }
}

/**
 * Send a WhatsApp image message
 */
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<SendMessageResponse | null> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp API credentials not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "image",
          image: {
            link: imageUrl,
            caption,
          },
        } as WhatsAppMessage),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send WhatsApp image:", {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    return (await response.json()) as SendMessageResponse;
  } catch (error) {
    console.error("Error sending WhatsApp image:", error);
    return null;
  }
}

/**
 * Send a WhatsApp document
 */
export async function sendWhatsAppDocument(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<SendMessageResponse | null> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp API credentials not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "document",
          document: {
            link: documentUrl,
            filename,
            caption,
          },
        } as WhatsAppMessage),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send WhatsApp document:", {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    return (await response.json()) as SendMessageResponse;
  } catch (error) {
    console.error("Error sending WhatsApp document:", error);
    return null;
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp API credentials not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to mark message as read:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
}

/**
 * Get WhatsApp business account info
 */
export async function getBusinessAccountInfo(): Promise<any | null> {
  if (!WHATSAPP_API_TOKEN) {
    console.error("WHATSAPP_API_TOKEN not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to get account info:", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting account info:", error);
    return null;
  }
}

interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: "body" | "header";
    parameters?: Array<
      | { type: "text"; text: string }
      | { type: "image"; image: { link: string } }
      | { type: "document"; document: { link: string; filename: string } }
    >;
  }>;
}

/**
 * Send a WhatsApp template message (for notifications)
 */
export async function sendWhatsAppTemplate(
  to: string,
  template: WhatsAppTemplate
): Promise<SendMessageResponse | null> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp API credentials not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send WhatsApp template:", {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    return (await response.json()) as SendMessageResponse;
  } catch (error) {
    console.error("Error sending WhatsApp template:", error);
    return null;
  }
}

/**
 * Format message for WhatsApp (remove markdown, handle special chars)
 */
export function formatForWhatsApp(text: string): string {
  // Remove markdown bold/italic
  let formatted = text.replace(/\*\*(.+?)\*\*/g, "$1");
  formatted = formatted.replace(/\*(.+?)\*/g, "$1");
  formatted = formatted.replace(/_(.+?)_/g, "$1");
  formatted = formatted.replace(/`(.+?)`/g, "$1");

  // Replace markdown links with plain text
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  // Handle emojis (most are already supported)
  // Replace some common markdown-style emojis
  formatted = formatted.replace(/:white_check_mark:/g, "✅");
  formatted = formatted.replace(/:warning:/g, "⚠️");
  formatted = formatted.replace(/:information_source:/g, "ℹ️");
  formatted = formatted.replace(/:x:/g, "❌");
  formatted = formatted.replace(/:heavy_check_mark:/g, "✓");

  // Clean up excessive newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted.trim();
}

/**
 * Split long message into WhatsApp-compatible chunks
 */
export function splitForWhatsApp(text: string, maxLength = 1600): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    // If paragraph itself is too long, split by sentences
    if (paragraph.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLength) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = sentence + " ";
        } else {
          currentChunk += sentence + " ";
        }
      }
    } else {
      // Check if adding this paragraph would exceed limit
      const separator = currentChunk ? "\n\n" : "";
      if ((currentChunk + separator + paragraph).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph + "\n\n";
      } else {
        currentChunk += separator + paragraph + "\n\n";
      }
    }
  }

  // Add the last chunk if any
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
