import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

/**
 * Verify WhatsApp webhook signature
 */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !WEBHOOK_SECRET) return false;

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature.replace("sha256=", "")),
    Buffer.from(expectedSignature)
  );
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_API_TOKEN) {
    console.error("WHATSAPP_API_TOKEN not configured");
    return;
  }

  // WhatsApp has 1600 character limit (increased from 160)
  const MAX_LENGTH = 1600;

  // Split message if too long
  const messages = [];
  let currentMessage = "";

  // Split by paragraphs first
  const paragraphs = message.split("\n\n");

  for (const paragraph of paragraphs) {
    if ((currentMessage + paragraph).length > MAX_LENGTH) {
      if (currentMessage) {
        messages.push(currentMessage.trim());
        currentMessage = paragraph + "\n\n";
      } else {
        // Paragraph itself is too long, split by sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if ((currentMessage + sentence).length > MAX_LENGTH) {
            messages.push(currentMessage.trim());
            currentMessage = sentence + " ";
          } else {
            currentMessage += sentence + " ";
          }
        }
      }
    } else {
      currentMessage += paragraph + "\n\n";
    }
  }

  if (currentMessage.trim()) {
    messages.push(currentMessage.trim());
  }

  // Send each message part
  for (const msg of messages) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: msg },
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to send WhatsApp message:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
    }
  }
}

/**
 * Process incoming WhatsApp message
 */
async function processWhatsAppMessage(from: string, message: string) {
  try {
    // Extract command from message
    const command = message.trim().toLowerCase();

    // Get or create user session
    const session = await auth();
    if (!session?.user) {
      // Create guest user for WhatsApp
      const guestEmail = `whatsapp-${from.replace(/[^a-zA-Z0-9]/g, "")}`;
      // Note: Would need to implement guest user creation for WhatsApp
      // For now, return error
      return {
        success: false,
        error: "Unable to authenticate WhatsApp user. Please contact support.",
      };
    }

    // Handle simple commands
    if (command.includes("help") || command === "h" || command === "?") {
      return {
        response: `🤖 Sofia AI Property Assistant

Commands:
• "create listing" - Create a property listing
• "upload" - Upload a listing to zyprus.com
• "locations" - See available locations
• "help" - Show this help

Type your request in plain English and I'll help you!`,
      };
    }

    if (command.includes("locations") || command.includes("where")) {
      return {
        response: `📍 To see available locations, please use the web interface or type "help" for available commands.`,
      };
    }

    if (command.includes("create") || command.includes("listing")) {
      return {
        response: `🏠 To create a listing, please provide details like:

"Create a 3-bedroom apartment in Limassol for €300,000"

I'll guide you through the process!`,
      };
    }

    // Default response for unrecognized commands
    return {
      response: `🤖 Hello! I'm Sofia, your property assistant.

I can help you create and upload property listings to zyprus.com.

Type "help" to see available commands or just tell me what you'd like to do!`,
    };
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    return {
      response:
        "Sorry, I encountered an error. Please try again or contact support.",
    };
  }
}

/**
 * POST handler for incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify webhook signature in production
    if (
      process.env.NODE_ENV === "production" &&
      !verifySignature(body, signature)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);

    // Handle different webhook types
    if (data.object === "whatsapp_business_account") {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            for (const message of change.value.messages) {
              if (message.type === "text") {
                const from = message.from;
                const text = message.text.body;

                // Process the message
                const result = await processWhatsAppMessage(from, text);

                // Send response back
                if (result.response) {
                  await sendWhatsAppMessage(from, result.response);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification (WhatsApp challenge)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify webhook subscription
  if (mode === "subscribe" && WEBHOOK_SECRET && token === WEBHOOK_SECRET) {
    return NextResponse.json(Number(challenge), { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
