import "server-only";
import type { TelegramWebhookInfo } from "./types";

/**
 * Telegram Bot API Client
 * Handles all communication with Telegram Bot API
 */
export class TelegramClient {
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor(botToken: string) {
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is required");
    }
    this.botToken = botToken;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Send a text message to a Telegram chat
   */
  async sendMessage({
    chatId,
    text,
    replyToMessageId,
    parseMode = "Markdown",
  }: {
    chatId: number | string;
    text: string;
    replyToMessageId?: number;
    parseMode?: "Markdown" | "HTML" | "MarkdownV2";
  }): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          reply_to_message_id: replyToMessageId,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error("Telegram API error:", data);
        throw new Error(data.description || "Failed to send message");
      }

      return data.result;
    } catch (error) {
      console.error("Error sending Telegram message:", error);
      throw error;
    }
  }

  /**
   * Send typing action to show bot is processing
   */
  async sendChatAction({
    chatId,
    action = "typing",
  }: {
    chatId: number | string;
    action?: "typing" | "upload_photo" | "upload_document";
  }): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/sendChatAction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          action,
        }),
      });
    } catch (error) {
      console.error("Error sending chat action:", error);
    }
  }

  /**
   * Set webhook URL for receiving updates
   */
  async setWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message", "edited_message"],
          drop_pending_updates: false,
        }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error("Error setting webhook:", error);
      return false;
    }
  }

  /**
   * Get current webhook info
   */
  async getWebhookInfo(): Promise<TelegramWebhookInfo | null> {
    try {
      const response = await fetch(`${this.apiUrl}/getWebhookInfo`);
      const data = await response.json();

      if (data.ok) {
        return data.result;
      }
      return null;
    } catch (error) {
      console.error("Error getting webhook info:", error);
      return null;
    }
  }

  /**
   * Delete webhook (for local testing)
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/deleteWebhook`, {
        method: "POST",
      });
      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error("Error deleting webhook:", error);
      return false;
    }
  }

  /**
   * Get bot information
   */
  async getMe(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const data = await response.json();
      return data.ok ? data.result : null;
    } catch (error) {
      console.error("Error getting bot info:", error);
      return null;
    }
  }

  /**
   * Send a long message by splitting it into chunks
   */
  async sendLongMessage({
    chatId,
    text,
    maxLength = 4096,
    replyToMessageId,
  }: {
    chatId: number | string;
    text: string;
    maxLength?: number;
    replyToMessageId?: number;
  }): Promise<void> {
    if (text.length <= maxLength) {
      await this.sendMessage({ chatId, text, replyToMessageId });
      return;
    }

    // Split by paragraphs first to keep formatting
    const paragraphs = text.split("\n\n");
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length + 2 > maxLength) {
        // Send current chunk
        if (currentChunk) {
          await this.sendMessage({
            chatId,
            text: currentChunk.trim(),
            replyToMessageId,
          });
          currentChunk = "";
        }

        // If single paragraph is too long, split by sentences
        if (paragraph.length > maxLength) {
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxLength) {
              if (currentChunk) {
                await this.sendMessage({
                  chatId,
                  text: currentChunk.trim(),
                  replyToMessageId,
                });
              }
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }

    // Send remaining chunk
    if (currentChunk) {
      await this.sendMessage({
        chatId,
        text: currentChunk.trim(),
        replyToMessageId,
      });
    }
  }
}

// Singleton instance
let telegramClientInstance: TelegramClient | null = null;

export function getTelegramClient(): TelegramClient {
  if (!telegramClientInstance) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error(
        "TELEGRAM_BOT_TOKEN environment variable is not set. Get your token from @BotFather on Telegram."
      );
    }
    telegramClientInstance = new TelegramClient(botToken);
  }
  return telegramClientInstance;
}
