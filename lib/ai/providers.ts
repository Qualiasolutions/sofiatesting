import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// AI Gateway is REQUIRED - no fallback
// This ensures SOFIA always uses premium models
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
      // AI Gateway only - no Gemini fallback
      // Default to Claude Haiku 4.5 - fast, smart, and affordable
      const defaultModel = gateway("anthropic/claude-haiku-4.5");

      return customProvider({
        languageModels: {
          // Primary model: Claude Haiku 4.5 ($1.00/M input, $5.00/M output)
          "chat-model": defaultModel,
          "title-model": defaultModel,
          "artifact-model": defaultModel,

          // Alternative models via AI Gateway
          // GPT-4o Mini - Ultra cheap OpenAI option ($0.15/M input, $0.60/M output)
          "chat-model-gpt4o": gateway("openai/gpt-4o-mini"),

          // Claude Sonnet 4.5 - Best quality ($3.00/M input, $15.00/M output)
          "chat-model-sonnet": gateway("anthropic/claude-sonnet-4.5"),

          // Claude Haiku 4.5 - Fast & smart ($1.00/M input, $5.00/M output)
          "chat-model-haiku": gateway("anthropic/claude-haiku-4.5"),
        },
      });
    })();
