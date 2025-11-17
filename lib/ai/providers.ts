import { google } from "@ai-sdk/google";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

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

  // Check for GOOGLE_GENERATIVE_AI_API_KEY (required for Gemini API)
  const hasGeminiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // Enforce Gemini API requirement (only at runtime and not during testing)
  if (!hasGeminiKey && typeof window === "undefined" && !process.env.NODE_ENV?.includes("test")) {
    console.error(
      "[SOFIA] CRITICAL: Gemini API key is required. Please configure GOOGLE_GENERATIVE_AI_API_KEY."
    );
    throw new Error(
      "Gemini API configuration is required. Please set GOOGLE_GENERATIVE_AI_API_KEY environment variable."
    );
  }

  return hasGeminiKey;
})();

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, claudeModel, mistralSmallModel } =
        require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": mistralSmallModel,
          "artifact-model": claudeModel,
        },
      });
    })()
  : (() => {
      // Pure Gemini API approach - Latest stable models only
      // Default to Gemini 2.5 Flash - best price-performance ratio
      const defaultModel = google("gemini-2.5-flash");

      return customProvider({
        languageModels: {
          // Primary model: Gemini 2.5 Flash (default)
          // Best price-performance with thinking capabilities
          "chat-model": defaultModel,
          "title-model": defaultModel,
          "artifact-model": defaultModel,

          // Gemini 2.5 Pro - Most powerful reasoning model
          // Extended context, advanced thinking, best for complex tasks
          "chat-model-pro": google("gemini-2.5-pro"),

          // Gemini 2.5 Flash-Lite - Ultra fast and cost-efficient
          // Optimized for high throughput, simple tasks
          "chat-model-flash-lite": google("gemini-2.5-flash-lite"),

          // Alternative naming for consistency
          "chat-model-flash": google("gemini-2.5-flash"),
        },
      });
    })();