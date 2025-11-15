import { gateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Check for available AI providers
const isGatewayConfigured = (() => {
  // In test environment, providers are not needed
  if (isTestEnvironment) return false;

  return !!process.env.AI_GATEWAY_API_KEY;
})();

const isGeminiConfigured = (() => {
  // In test environment, providers are not needed
  if (isTestEnvironment) return false;

  return !!(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
})();

// Validate that at least one provider is configured
if (!isTestEnvironment && typeof window === "undefined") {
  if (!isGeminiConfigured && !isGatewayConfigured) {
    console.error(
      "[SOFIA] CRITICAL: No AI provider configured. Please set GEMINI_API_KEY or AI_GATEWAY_API_KEY."
    );
    throw new Error(
      "AI provider configuration is required. Please set GEMINI_API_KEY or AI_GATEWAY_API_KEY environment variable."
    );
  }

  if (isGeminiConfigured) {
    console.log("[SOFIA] ✓ Gemini AI configured (FREE models available)");
  }
  if (isGatewayConfigured) {
    console.log("[SOFIA] ✓ AI Gateway configured (Premium models available)");
  }
}

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
      // Hybrid provider setup: Gemini (FREE) + Claude via AI Gateway (Premium)
      // Default to Gemini if available, otherwise use AI Gateway

      // Build language models object dynamically based on available providers
      const languageModels: Record<string, any> = {};

      // Gemini models (FREE via Google AI)
      if (isGeminiConfigured) {
        const geminiFlash = google("gemini-2.0-flash-exp");
        const geminiPro = google("gemini-2.5-pro-exp");

        // Set Gemini Flash as default
        languageModels["chat-model"] = geminiFlash;
        languageModels["title-model"] = geminiFlash;
        languageModels["artifact-model"] = geminiFlash;

        // Add individual Gemini models
        languageModels["chat-model-gemini-flash"] = geminiFlash;
        languageModels["chat-model-gemini-pro"] = geminiPro;
      }

      // Claude models (Premium via AI Gateway)
      if (isGatewayConfigured) {
        const claudeHaiku = gateway("anthropic/claude-haiku-4.5");
        const claudeSonnet = gateway("anthropic/claude-sonnet-4.5");

        // If Gemini not configured, use Claude as default
        if (!isGeminiConfigured) {
          languageModels["chat-model"] = claudeHaiku;
          languageModels["title-model"] = claudeHaiku;
          languageModels["artifact-model"] = claudeHaiku;
        }

        // Add individual Claude models
        languageModels["chat-model-haiku"] = claudeHaiku;
        languageModels["chat-model-sonnet"] = claudeSonnet;
      }

      return customProvider({
        languageModels,
      });
    })();
