import { tool } from "ai";
import { z } from "zod";
import { getWhatsAppClient } from "../client";
import { generateDocx } from "../docx-generator";

/**
 * WhatsApp-specific sendDocument tool
 *
 * Unlike the web sendDocument tool which uses dataStream to show a UI form,
 * this tool directly generates and sends the document via WhatsApp.
 *
 * Use this when the user is interacting via WhatsApp and wants:
 * - A document generated and sent to them
 * - A form, contract, or registration document
 * - Any formal document that should be in DOCX format
 */
export const createWhatsAppSendDocumentTool = (recipientPhone: string) =>
  tool({
    description: `Generate and send a document directly to the user via WhatsApp. Use this tool when:
- The user wants a document generated and sent to them
- The user asks for a form, contract, registration document, or agreement
- The response should be in a formal document format (DOCX)
- The user explicitly asks for a document to be sent

DO NOT use this for:
- Simple text responses or calculations (send as regular text)
- Informal communications
- Short answers that don't need document formatting`,
    inputSchema: z.object({
      title: z
        .string()
        .describe(
          "Title/filename for the document (e.g., 'Seller Registration Form')"
        ),
      content: z
        .string()
        .describe(
          "The full text content of the document. Use **text** for bold headings and formatting."
        ),
    }),
    execute: async ({ title, content }) => {
      const client = getWhatsAppClient();

      if (!client.isConfigured()) {
        return {
          success: false,
          error: "WhatsApp service is not configured. Please contact support.",
        };
      }

      try {
        console.log("[WhatsApp] Generating document:", {
          title,
          contentLength: content.length,
          recipientPhone,
        });

        // Generate DOCX from content
        const docBuffer = await generateDocx(content);

        // Create safe filename
        const safeTitle = title
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, "_");
        const filename = `SOFIA_${safeTitle}_${Date.now()}.docx`;

        console.log("[WhatsApp] Sending document:", {
          filename,
          size: docBuffer.length,
          recipientPhone,
        });

        // Send via WhatsApp
        const result = await client.sendDocument({
          to: recipientPhone,
          document: docBuffer,
          filename,
          caption: `Here is your ${title}`,
        });

        if (result.success) {
          console.log("[WhatsApp] Document sent successfully:", {
            filename,
            messageId: result.messageId,
          });

          return {
            success: true,
            message: `Document "${title}" has been generated and sent to your WhatsApp. Please check your messages.`,
            filename,
          };
        }

        console.error("[WhatsApp] Document send failed:", result.error);
        return {
          success: false,
          error: result.error || "Failed to send document via WhatsApp",
        };
      } catch (error) {
        console.error("[WhatsApp] Document generation/send error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Document generation failed. Please try again.",
        };
      }
    },
  });
