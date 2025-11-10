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
      // Use latest Gemini 2.0 Flash as default model
      const geminiFlash = google("gemini-2.0-flash-exp");

      return customProvider({
        languageModels: {
          // Primary models: Gemini 2.0 Flash (fast, cost-effective, multimodal)
          "chat-model": geminiFlash, // Default model - latest Gemini 2.0 Flash
          "title-model": geminiFlash, // Title generation
          "artifact-model": geminiFlash, // Artifact generation

          // Premium models via AI Gateway (with fallback to Gemini if not configured)
          "chat-model-gpt4o": isGatewayConfigured
            ? gateway("openai/gpt-4o")
            : geminiFlash,
          "chat-model-sonnet": isGatewayConfigured
            ? wrapLanguageModel({
                model: gateway("anthropic/claude-3-5-sonnet-latest"),
                middleware: extractReasoningMiddleware({ tagName: "thinking" }),
              })
            : geminiFlash,
          "chat-model-haiku": isGatewayConfigured
            ? gateway("anthropic/claude-3-5-haiku-latest")
            : geminiFlash,
        },
      });
    })();
