import { NextResponse } from "next/server";
import { handleWhatsAppMessage } from "@/lib/whatsapp/message-handler";
import type { WaSenderWebhookMessage, WaSenderMessageData } from "@/lib/whatsapp/types";

/**
 * WhatsApp Webhook Endpoint for WaSenderAPI
 *
 * Configure this URL in your WaSenderAPI dashboard:
 * https://your-domain.vercel.app/api/whatsapp/webhook
 */

/**
 * POST - Handle incoming WhatsApp messages from WaSenderAPI
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("x-webhook-secret");
      if (authHeader !== webhookSecret) {
        console.warn("WhatsApp webhook: Invalid secret token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as WaSenderWebhookMessage;

    console.log("WhatsApp webhook received:", {
      event: body.event,
      instanceId: body.instanceId,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (body.event) {
      case "message": {
        const messageData = body.data as WaSenderMessageData;

        // Process message asynchronously to respond quickly to webhook
        // WaSenderAPI expects a quick 200 response
        handleWhatsAppMessage(messageData).catch((error) => {
          console.error("Error processing WhatsApp message:", {
            error: error instanceof Error ? error.message : "Unknown error",
            from: messageData.from,
            type: messageData.type,
          });
        });

        break;
      }

      case "status": {
        // Message delivery status update
        console.log("WhatsApp status update:", body.data);
        break;
      }

      case "connection": {
        // Connection status change
        console.log("WhatsApp connection update:", body.data);
        break;
      }

      default:
        console.log("Unknown WhatsApp webhook event:", body.event);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 200 even on error to prevent webhook retries flooding
    return NextResponse.json({ success: false, error: "Processing error" });
  }
}

/**
 * GET - Webhook verification endpoint
 * Some webhook providers require GET for verification
 */
export async function GET(): Promise<Response> {
  return NextResponse.json({
    status: "active",
    service: "SOFIA WhatsApp Integration",
    provider: "WaSenderAPI",
    timestamp: new Date().toISOString(),
  });
}
