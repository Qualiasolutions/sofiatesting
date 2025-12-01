import "server-only";

/**
 * WhatsApp Client for WaSenderAPI
 * Handles communication with WaSenderAPI service
 */
export class WhatsAppClient {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instanceId: string;

  constructor() {
    this.apiUrl = process.env.WASENDER_API_URL || "https://api.wasender.io";
    this.apiKey = process.env.WASENDER_API_KEY || "";
    this.instanceId = process.env.WASENDER_INSTANCE_ID || "";

    if (!this.apiKey) {
      console.warn(
        "WASENDER_API_KEY is not set - WhatsApp integration disabled"
      );
    }
  }

  /**
   * Send a text message
   */
  async sendMessage({ to, text }: { to: string; text: string }): Promise<any> {
    if (!this.apiKey) {
      console.warn("WhatsApp API key not configured");
      return { success: false, error: "API key not configured" };
    }

    try {
      const response = await fetch(`${this.apiUrl}/v1/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          instanceId: this.instanceId,
          to,
          type: "text",
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("WhatsApp send message error:", data);
        throw new Error(data.message || "Failed to send message");
      }

      return data;
    } catch (error) {
      console.error("WhatsApp send error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        to,
        textLength: text.length,
      });
      throw error;
    }
  }

  /**
   * Send a document file
   */
  async sendDocument({
    to,
    document,
    filename,
    caption,
  }: {
    to: string;
    document: Buffer;
    filename: string;
    caption?: string;
  }): Promise<any> {
    if (!this.apiKey) {
      console.warn("WhatsApp API key not configured");
      return { success: false, error: "API key not configured" };
    }

    try {
      // Convert buffer to base64 for API upload
      const base64Document = document.toString("base64");

      const response = await fetch(`${this.apiUrl}/v1/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          instanceId: this.instanceId,
          to,
          type: "document",
          document: {
            data: base64Document,
            filename,
            caption,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("WhatsApp send document error:", data);
        throw new Error(data.message || "Failed to send document");
      }

      return data;
    } catch (error) {
      console.error("WhatsApp send document error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        to,
        filename,
      });
      throw error;
    }
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.instanceId;
  }
}

// Singleton instance
let whatsAppClientInstance: WhatsAppClient | null = null;

export function getWhatsAppClient(): WhatsAppClient {
  if (!whatsAppClientInstance) {
    whatsAppClientInstance = new WhatsAppClient();
  }
  return whatsAppClientInstance;
}
