import { NextResponse } from "next/server";
import { handleWhatsAppMessage } from "@/lib/whatsapp/message-handler";
import type {
  WaSenderMessageData,
  WaSenderSessionData,
  WaSenderStatusData,
  WaSenderWebhookPayload,
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
 * POST - Handle incoming WhatsApp messages from WaSenderAPI
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET;
    if (webhookSecret) {
      // WaSenderAPI sends secret in x-webhook-secret header
      const authHeader =
        request.headers.get("x-webhook-secret") ||
        request.headers.get("x-wasender-signature");

      if (authHeader !== webhookSecret) {
        console.warn("[WhatsApp Webhook] Invalid secret token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as WaSenderWebhookPayload;

    console.log("[WhatsApp Webhook] Event received:", {
      event: body.event,
      sessionId: body.sessionId,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (body.event) {
      case "message": {
        const messageData = body.data as WaSenderMessageData;

        // Process message asynchronously to respond quickly to webhook
        // WaSenderAPI expects a quick 200 response
        handleWhatsAppMessage(messageData).catch((error) => {
          console.error("[WhatsApp Webhook] Error processing message:", {
            error: error instanceof Error ? error.message : "Unknown error",
            from: messageData.from,
            type: messageData.type,
          });
        });

        break;
      }

      case "message.status": {
        // Message delivery status update
        const statusData = body.data as WaSenderStatusData;
        console.log("[WhatsApp Webhook] Message status update:", {
          messageId: statusData.id,
          status: statusData.status,
          timestamp: statusData.timestamp,
        });
        break;
      }

      case "session.status": {
        // Session connection status change
        const sessionData = body.data as WaSenderSessionData;
        console.log("[WhatsApp Webhook] Session status update:", {
          status: sessionData.status,
          hasQR: !!sessionData.qrCode,
        });
        break;
      }

      case "contact.upsert":
      case "group.update":
      case "call": {
        // Log other events for debugging
        console.log(`[WhatsApp Webhook] ${body.event}:`, body.data);
        break;
      }

      default:
        console.log("[WhatsApp Webhook] Unknown event:", body.event, body.data);
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
    version: "2.0",
    timestamp: new Date().toISOString(),
  });
}
