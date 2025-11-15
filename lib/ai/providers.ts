import { gateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// AI Gateway configuration
const isGatewayConfigured = (() => {
  // In test environment, gateway is not needed
  if (isTestEnvironment) return false;

  // Skip validation during Next.js build process
  // AI_GATEWAY_API_KEY will be available at runtime from Vercel env vars
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
  if (isBuildTime) {
    console.log("[SOFIA] Build time detected - skipping AI Gateway validation");
    return false; // Will be configured at runtime
  }

  // Check for AI_GATEWAY_API_KEY environment variable
  const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY;

  // Enforce AI Gateway requirement (only at runtime)
  if (!hasGatewayKey && typeof window === "undefined") {
    console.error(
      "[SOFIA] CRITICAL: AI Gateway API key is required. Please configure AI_GATEWAY_API_KEY."
    );
    throw new Error(
      "AI Gateway configuration is required. Please set AI_GATEWAY_API_KEY environment variable."
    );
  }

  return hasGatewayKey;
})();

// Gemini API configuration
const isGeminiConfigured = (() => {
  // In test environment, not needed
  if (isTestEnvironment) return false;

  // Skip validation during build
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
  if (isBuildTime) {
    console.log("[SOFIA] Build time detected - skipping Gemini API validation");
    return false;
  }

  // Check for GOOGLE_GENERATIVE_AI_API_KEY
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
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
      // Hybrid approach: AI Gateway (Claude, GPT) + Direct Gemini
      // Default to Claude Haiku 4.5 - fast, smart, and affordable
      const defaultModel = gateway("anthropic/claude-haiku-4.5");

      return customProvider({
        languageModels: {
          // Primary model: Claude Haiku 4.5 ($1.00/M input, $5.00/M output)
          "chat-model": defaultModel,
          "title-model": defaultModel,
          "artifact-model": defaultModel,

          // Claude models via AI Gateway
          // Claude Sonnet 4.5 - Best quality ($3.00/M input, $15.00/M output)
          "chat-model-sonnet": gateway("anthropic/claude-sonnet-4.5"),
          // Claude Haiku 4.5 - Fast & smart ($1.00/M input, $5.00/M output)
          "chat-model-haiku": gateway("anthropic/claude-haiku-4.5"),

          // OpenAI models via AI Gateway
          // GPT-4o Mini - Ultra cheap OpenAI option ($0.15/M input, $0.60/M output)
          "chat-model-gpt4o": gateway("openai/gpt-4o-mini"),

          // Google Gemini models (Direct API integration)
          // Gemini 2.0 Flash - Experimental fast model
          "chat-model-gemini-flash": google("gemini-2.0-flash-exp"),
          // Gemini 1.5 Pro - Powerful reasoning
          "chat-model-gemini-pro": google("gemini-1.5-pro-002"),
        },
      });
    })();
