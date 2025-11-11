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
      // Use stable Gemini 1.5 Flash (proven, production-ready)
      const geminiFlash = google("gemini-1.5-flash-latest");

      return customProvider({
        languageModels: {
          // Primary models: Gemini 1.5 Flash (fast, cost-effective, proven)
          "chat-model": geminiFlash, // Default model - Gemini 1.5 Flash (stable)
          "title-model": geminiFlash, // Title generation
          "artifact-model": geminiFlash, // Artifact generation

          // Premium models via AI Gateway (with fallback to Gemini if not configured)
          "chat-model-gpt4o": isGatewayConfigured
            ? gateway("openai/gpt-4o")
            : geminiFlash,
          "chat-model-sonnet": isGatewayConfigured
            ? wrapLanguageModel({
                model: gateway("anthropic/claude-sonnet-4-5-20250929"),
                middleware: extractReasoningMiddleware({ tagName: "thinking" }),
              })
            : geminiFlash,
          "chat-model-haiku": isGatewayConfigured
            ? gateway("anthropic/claude-haiku-4-5-20251001")
            : geminiFlash,
        },
      });
    })();
