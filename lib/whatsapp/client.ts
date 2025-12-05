import "server-only";
import { createWasender, type WasenderAPIError } from "wasenderapi";

/**
 * WhatsApp Client for WaSenderAPI
 * Uses the official wasenderapi npm package for type-safe integration
 *
 * Setup:
 * 1. Create account at https://wasenderapi.com (~$6/month)
 * 2. Connect WhatsApp via QR code
 * 3. Set environment variables:
 *    - WASENDER_API_KEY: Session-specific API key
 *    - WASENDER_PERSONAL_ACCESS_TOKEN: Account-level PAT (optional)
 *    - WASENDER_WEBHOOK_SECRET: For webhook verification
 */

// Environment configuration
const API_KEY = process.env.WASENDER_API_KEY || "";
const PERSONAL_ACCESS_TOKEN = process.env.WASENDER_PERSONAL_ACCESS_TOKEN;
const WEBHOOK_SECRET = process.env.WASENDER_WEBHOOK_SECRET;

// Log configuration status
if (!API_KEY) {
  console.warn(
    "[WhatsApp] WASENDER_API_KEY is not set - WhatsApp integration disabled"
  );
}

/**
 * Create the WaSender client instance
 * Uses official SDK with retry support for rate limits
 */
const wasenderClient = API_KEY
  ? createWasender(
      API_KEY,
      PERSONAL_ACCESS_TOKEN,
      undefined, // Use default base URL
      undefined, // Use default fetch
      {
        enabled: true,
        maxRetries: 3,
      },
      WEBHOOK_SECRET
    )
  : null;

/**
 * WhatsApp Client wrapper for SOFIA
 * Provides simplified interface for common operations
 */
export class WhatsAppClient {
  /**
   * Send a text message
   */
  async sendMessage({ to, text }: { to: string; text: string }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!wasenderClient) {
      console.warn("[WhatsApp] Client not configured");
      return { success: false, error: "WhatsApp API key not configured" };
    }

    try {
      const response = await wasenderClient.sendText({
        to: formatPhoneNumber(to),
        text,
      });

      console.log("[WhatsApp] Message sent successfully", {
        to,
        textLength: text.length,
        rateLimit: response.rateLimit,
      });

      return {
        success: true,
        messageId: (response.response as any)?.id,
      };
    } catch (error) {
      const apiError = error as WasenderAPIError;
      console.error("[WhatsApp] Send message error:", {
        statusCode: apiError.statusCode,
        message: apiError.apiMessage,
        details: apiError.errorDetails,
        to,
        textLength: text.length,
      });

      return {
        success: false,
        error: apiError.apiMessage || "Failed to send message",
      };
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
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!wasenderClient) {
      console.warn("[WhatsApp] Client not configured");
      return { success: false, error: "WhatsApp API key not configured" };
    }

    try {
      // Convert buffer to base64 for API upload
      const base64Document = document.toString("base64");

      // Determine MIME type from filename
      const mimeType = getMimeType(filename);

      // Cast to any because SDK types only have documentUrl, but API supports documentBase64
      const response = await wasenderClient.send({
        messageType: "document",
        to: formatPhoneNumber(to),
        documentBase64: `data:${mimeType};base64,${base64Document}`,
        filename,
        caption,
      } as any);

      console.log("[WhatsApp] Document sent successfully", {
        to,
        filename,
        size: document.length,
        rateLimit: response.rateLimit,
      });

      return {
        success: true,
        messageId: (response.response as any)?.id,
      };
    } catch (error) {
      const apiError = error as WasenderAPIError;
      console.error("[WhatsApp] Send document error:", {
        statusCode: apiError.statusCode,
        message: apiError.apiMessage,
        details: apiError.errorDetails,
        to,
        filename,
      });

      return {
        success: false,
        error: apiError.apiMessage || "Failed to send document",
      };
    }
  }

  /**
   * Send an image
   */
  async sendImage({
    to,
    image,
    caption,
  }: {
    to: string;
    image: Buffer | string; // Buffer or URL
    caption?: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!wasenderClient) {
      return { success: false, error: "WhatsApp API key not configured" };
    }

    try {
      // Cast to any because SDK types only have imageUrl, but API supports imageBase64
      const payload =
        typeof image === "string"
          ? {
              messageType: "image" as const,
              to: formatPhoneNumber(to),
              imageUrl: image,
              caption,
            }
          : {
              messageType: "image" as const,
              to: formatPhoneNumber(to),
              imageBase64: `data:image/jpeg;base64,${image.toString("base64")}`,
              caption,
            };

      const response = await wasenderClient.send(payload as any);

      return {
        success: true,
        messageId: (response.response as any)?.id,
      };
    } catch (error) {
      const apiError = error as WasenderAPIError;
      return {
        success: false,
        error: apiError.apiMessage || "Failed to send image",
      };
    }
  }

  /**
   * Send a long text message, automatically splitting if needed
   * WhatsApp has a 4096 character limit per message
   */
  async sendLongMessage({ to, text }: { to: string; text: string }): Promise<{
    success: boolean;
    messageIds?: string[];
    error?: string;
  }> {
    const MAX_LENGTH = 4000; // Leave buffer for safety

    if (text.length <= MAX_LENGTH) {
      const result = await this.sendMessage({ to, text });
      return {
        success: result.success,
        messageIds: result.messageId ? [result.messageId] : undefined,
        error: result.error,
      };
    }

    // Split message by paragraphs first, then by sentences
    const chunks: string[] = [];
    let current = "";

    for (const paragraph of text.split("\n\n")) {
      if ((current + "\n\n" + paragraph).length > MAX_LENGTH) {
        if (current) {
          chunks.push(current.trim());
        }
        // If single paragraph is too long, split by sentences
        if (paragraph.length > MAX_LENGTH) {
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          let sentenceChunk = "";
          for (const sentence of sentences) {
            if ((sentenceChunk + " " + sentence).length > MAX_LENGTH) {
              if (sentenceChunk) chunks.push(sentenceChunk.trim());
              sentenceChunk = sentence;
            } else {
              sentenceChunk += (sentenceChunk ? " " : "") + sentence;
            }
          }
          if (sentenceChunk) chunks.push(sentenceChunk.trim());
          current = "";
        } else {
          current = paragraph;
        }
      } else {
        current += (current ? "\n\n" : "") + paragraph;
      }
    }
    if (current) {
      chunks.push(current.trim());
    }

    // Send each chunk with rate limiting delay
    const messageIds: string[] = [];
    let hasError = false;
    let lastError = "";

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const result = await this.sendMessage({ to, text: chunk });

      if (result.success && result.messageId) {
        messageIds.push(result.messageId);
      } else {
        hasError = true;
        lastError = result.error || "Unknown error";
      }

      // Rate limit: wait 500ms between messages
      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return {
      success: !hasError,
      messageIds: messageIds.length > 0 ? messageIds : undefined,
      error: hasError ? lastError : undefined,
    };
  }

  /**
   * Check if client is configured and ready
   */
  isConfigured(): boolean {
    return !!wasenderClient;
  }

  /**
   * Get rate limit information from last request
   */
  getRateLimitInfo() {
    // Rate limit info is returned per-request
    // This method exists for API compatibility
    return null;
  }
}

/**
 * Format phone number for WhatsApp API
 * Ensures number is in correct format (no + prefix, just digits)
 */
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove leading + if present (WaSender expects just digits)
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    // Video
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}

// Singleton instance
let whatsAppClientInstance: WhatsAppClient | null = null;

export const getWhatsAppClient = (): WhatsAppClient => {
  if (!whatsAppClientInstance) {
    whatsAppClientInstance = new WhatsAppClient();
  }
  return whatsAppClientInstance;
};

/**
 * Export the raw wasender client for advanced operations
 * Use this for direct SDK access (groups, contacts, sessions)
 */
export { wasenderClient };
