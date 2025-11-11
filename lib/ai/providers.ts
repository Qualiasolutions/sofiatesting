import { google } from "@ai-sdk/google";
import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Check if AI Gateway is properly configured
// This runs at module initialization time, which happens server-side during build/runtime
const isGatewayConfigured = (() => {
  // In test environment, gateway is not needed
  if (isTestEnvironment) return false;

  // Check for AI_GATEWAY_API_KEY environment variable
  const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY;

  // Only log warning during server-side initialization
  // typeof window check ensures this only logs on server
  if (!hasGatewayKey && typeof window === "undefined") {
    console.warn(
      "[SOFIA] AI Gateway not configured. Premium models (Claude, GPT-4o) will fall back to Gemini 1.5 Flash."
    );
  }

  return hasGatewayKey;
})();

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, claudeModel, mistralSmallModel } =
        require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": claudeModel,
          "chat-model-sonnet": claudeModel,
          "chat-model-haiku": claudeModel,
          "chat-model-gpt4o": chatModel,
          "title-model": mistralSmallModel,
          "artifact-model": claudeModel,
        },
      });
    })()
  : (() => {
      // Use Gemini 2.0 Flash - ultra cheap ($0.10/M input, $0.40/M output) and fast
      const geminiFlash = google("gemini-2.0-flash");

      return customProvider({
        languageModels: {
          // Primary models: Gemini 2.0 Flash (ultra cheap, fast, reliable)
          "chat-model": geminiFlash, // Default model - Gemini 2.0 Flash
          "title-model": geminiFlash, // Title generation
          "artifact-model": geminiFlash, // Artifact generation

          // Premium models via AI Gateway (with fallback to Gemini if not configured)
          // GPT-4o Mini - Cheap OpenAI option ($0.15/M input, $0.60/M output)
          "chat-model-gpt4o": isGatewayConfigured
            ? gateway("openai/gpt-4o-mini")
            : geminiFlash,
          // Claude Sonnet 4.5 - Best quality ($3.00/M input, $15.00/M output)
          "chat-model-sonnet": isGatewayConfigured
            ? wrapLanguageModel({
                model: gateway("anthropic/claude-sonnet-4.5"),
                middleware: extractReasoningMiddleware({ tagName: "thinking" }),
              })
            : geminiFlash,
          // Claude Haiku 4.5 - Fast & smart ($1.00/M input, $5.00/M output)
          "chat-model-haiku": isGatewayConfigured
            ? gateway("anthropic/claude-haiku-4.5")
            : geminiFlash,
        },
      });
    })();
