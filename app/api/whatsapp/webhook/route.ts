import { NextResponse } from "next/server";
import { handleWhatsAppMessage } from "@/lib/whatsapp/message-handler";
import type {
  WaSenderMessageData,
  WaSenderSessionData,
  WaSenderStatusData,
} from "@/lib/whatsapp/types";

/**
 * WhatsApp Webhook Endpoint for WaSenderAPI
 *
 * Configure this URL in your WaSenderAPI dashboard:
 * https://your-domain.vercel.app/api/whatsapp/webhook
 *
 * Setup:
 * 1. Go to WaSenderAPI dashboard
 * 2. Navigate to webhook settings
 * 3. Set webhook URL to: https://your-domain/api/whatsapp/webhook
 * 4. Set WASENDER_WEBHOOK_SECRET env var and configure in dashboard
 */

/**
 * WaSenderAPI webhook payload structure (from SDK types)
 *
 * MessagesUpsertEvent:
 * {
 *   type: "messages.upsert",
 *   sessionId?: string,
 *   timestamp?: number,
 *   data: MessagesUpsertData | MessagesUpsertData[]
 * }
 *
 * MessagesUpsertData:
 * {
 *   key: { id: string, fromMe: boolean, remoteId: string, participant?: string },
 *   message?: { conversation?: string, imageMessage?: {...}, ... },
 *   pushName?: string,
 *   messageTimestamp?: number
 * }
 */

/**
 * POST - Handle incoming WhatsApp messages from WaSenderAPI
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // Log EVERYTHING for debugging
    console.log(
      "[WhatsApp Webhook] RAW PAYLOAD:",
      JSON.stringify(body, null, 2)
    );

    // Handle test webhook event (legacy format)
    if (body.event === "webhook.test") {
      console.log("[WhatsApp Webhook] Test event received successfully");
      return NextResponse.json({
        success: true,
        message: "Webhook test successful",
      });
    }

    // WaSenderAPI uses 'type' field for event type (SDK standard)
    // Fall back to 'event' for legacy support
    const eventType = body.type || body.event;

    console.log("[WhatsApp Webhook] Event received:", {
      event: body.event,
      type: body.type,
      eventType,
      sessionId: body.sessionId,
      timestamp: new Date().toISOString(),
    });

    switch (eventType) {
      case "message":
      case "messages.received":
      case "messages.upsert": {
        // WaSenderAPI has TWO formats:
        // 1. SDK format: body.data is MessagesUpsertData | MessagesUpsertData[]
        // 2. Webhook format: body.data.messages is the message object
        const rawData = body.data;

        if (!rawData) {
          console.log("[WhatsApp Webhook] No data in payload");
          return NextResponse.json({ success: true });
        }

        // Check if messages are nested under "messages" key (webhook format)
        // or directly in data (SDK format)
        let messageSource = rawData;
        if (rawData.messages && !rawData.key) {
          // Webhook format: data.messages contains the message
          messageSource = rawData.messages;
          console.log("[WhatsApp Webhook] Using nested messages format");
        }

        // Handle both single object and array formats
        const messagesArray = Array.isArray(messageSource)
          ? messageSource
          : [messageSource];

        for (const msgData of messagesArray) {
          // Skip if no message data
          if (!msgData) {
            console.log("[WhatsApp Webhook] Empty message entry, skipping");
            continue;
          }

          // Extract message from WaSenderAPI format
          // SDK types: key.remoteId (not remoteJid), message.conversation for text
          let messageData: WaSenderMessageData;

          if (msgData.key && msgData.message) {
            const key = msgData.key;
            const msg = msgData.message;

            // remoteId is the standard field per SDK, but check remoteJid for compatibility
            const remoteId = key.remoteId || key.remoteJid || "";

            // Skip messages from self (bot's own messages)
            if (key.fromMe) {
              console.log(
                "[WhatsApp Webhook] Skipping own message (fromMe=true)"
              );
              continue;
            }

            // Extract text from various message types
            const messageText =
              msg.conversation || // Plain text message
              msg.extendedTextMessage?.text || // Extended text (with link preview, etc.)
              msg.imageMessage?.caption || // Image caption
              msg.videoMessage?.caption || // Video caption
              msg.documentMessage?.caption || // Document caption
              msgData.messageBody || // Fallback: some versions use messageBody
              "";

            // Determine message type
            let msgType: WaSenderMessageData["type"] = "text";
            if (msg.imageMessage) {
              msgType = "image";
            } else if (msg.videoMessage) {
              msgType = "video";
            } else if (msg.audioMessage) {
              msgType = "audio";
            } else if (msg.documentMessage) {
              msgType = "document";
            } else if (msg.locationMessage) {
              msgType = "location";
            } else if (msg.contactMessage) {
              msgType = "vcard";
            }

            messageData = {
              id: key.id,
              from: remoteId
                .replace("@s.whatsapp.net", "")
                .replace("@g.us", ""),
              to: "",
              type: msgType,
              text: messageText,
              timestamp: msgData.messageTimestamp || Date.now(),
              isGroup: remoteId.includes("@g.us"),
              sender: msgData.pushName
                ? { id: key.participant || remoteId, name: msgData.pushName }
                : undefined,
            };
          } else {
            // Legacy/fallback format - use data as-is if it matches our expected structure
            console.log("[WhatsApp Webhook] Using legacy message format");
            messageData = msgData as WaSenderMessageData;
          }

          console.log("[WhatsApp Webhook] Parsed message data:", {
            from: messageData.from,
            type: messageData.type,
            textLength: messageData.text?.length || 0,
            text:
              messageData.text?.substring(0, 50) +
              (messageData.text && messageData.text.length > 50 ? "..." : ""),
            isGroup: messageData.isGroup,
          });

          // Skip if no text content for text messages
          if (messageData.type === "text" && !messageData.text) {
            console.log("[WhatsApp Webhook] Empty text message, skipping");
            continue;
          }

          // Process message asynchronously to respond quickly to webhook
          // WaSenderAPI expects a quick 200 response
          handleWhatsAppMessage(messageData).catch((error) => {
            console.error("[WhatsApp Webhook] Error processing message:", {
              error: error instanceof Error ? error.message : "Unknown error",
              stack: error instanceof Error ? error.stack : undefined,
              from: messageData.from,
              type: messageData.type,
            });
          });
        }

        break;
      }

      case "message.status":
      case "messages.update":
      case "message-receipt.update": {
        // Message delivery status update
        const statusData = body.data as WaSenderStatusData;
        console.log("[WhatsApp Webhook] Message status update:", {
          messageId: statusData?.id,
          status: statusData?.status,
          timestamp: statusData?.timestamp,
        });
        break;
      }

      case "session.status": {
        // Session connection status change
        const sessionData = body.data as WaSenderSessionData;
        console.log("[WhatsApp Webhook] Session status update:", {
          status: sessionData?.status,
          hasQR: !!(sessionData as any)?.qr,
        });
        break;
      }

      case "contact.upsert":
      case "contacts.upsert":
      case "group.update":
      case "groups.update":
      case "groups.upsert":
      case "chats.upsert":
      case "chats.update":
      case "call": {
        // Log other events for debugging but don't process
        console.log(
          `[WhatsApp Webhook] ${eventType}:`,
          JSON.stringify(body.data).substring(0, 200)
        );
        break;
      }

      default:
        console.log(
          "[WhatsApp Webhook] Unknown event:",
          eventType,
          JSON.stringify(body).substring(0, 500)
        );
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 200 even on error to prevent webhook retries flooding
    return NextResponse.json({ success: false, error: "Processing error" });
  }
}

/**
 * GET - Webhook verification endpoint
 * Used by WaSenderAPI to verify webhook URL is accessible
 */
export function GET(): Response {
  return NextResponse.json({
    status: "active",
    service: "SOFIA WhatsApp Integration",
    provider: "WaSenderAPI",
    version: "2.1",
    timestamp: new Date().toISOString(),
  });
}
