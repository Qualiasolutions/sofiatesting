import { google } from "@ai-sdk/google";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

// Gemini API configuration
const isGeminiConfigured = (() => {
  // In test environment, not needed
  if (isTestEnvironment) {
    return false;
  }

  // Build time detected - skipping Gemini API validation
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
  if (isBuildTime) {
    console.log("[SOFIA] Build time detected - skipping Gemini API validation");
    return false;
  }

  // Prioritize Vercel's GEMINI_API_KEY if present (overrides GOOGLE_GENERATIVE_AI_API_KEY)
  if (process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

  // Check for GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY (required for Gemini API)
  const hasGeminiKey = !!(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  );

  // Enforce Gemini API requirement (only at runtime and not during testing)
  if (
    !hasGeminiKey &&
    typeof window === "undefined" &&
    !process.env.NODE_ENV?.includes("test")
  ) {
    console.warn(
      "[SOFIA] WARNING: Gemini API key is missing. Chat functionality will not work."
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
          "chat-model-pro": chatModel,
          "chat-model-flash-lite": chatModel,
        },
      });
    })()
  : (() => {
      if (!isGeminiConfigured) {
        // Fallback for missing keys - prevents crash on startup
        const errorModel = {
          specificationVersion: "v1",
          provider: "google",
          modelId: "error-model",
          doGenerate: () => {
            throw new Error("Gemini API key is not configured.");
          },
          doStream: () => {
            throw new Error("Gemini API key is not configured.");
          },
        } as any;

        return customProvider({
          languageModels: {
            "chat-model": errorModel,
            "title-model": errorModel,
            "artifact-model": errorModel,
            "chat-model-pro": errorModel,
            "chat-model-gemini3": errorModel,
            "chat-model-flash-lite": errorModel,
            "chat-model-flash": errorModel,
          },
        });
      }

      // Pure Gemini API approach - Gemini 3 Pro as default (Dec 2024)
      // Default to Gemini 3 Pro Preview - best reasoning & multimodal model
      const defaultModel = google("gemini-3-pro-preview");

      return customProvider({
        languageModels: {
          // Primary model: Gemini 3 Pro Preview (default)
          // Best reasoning, 1M context, multimodal (text, image, video, audio, PDF)
          // Pricing: $2/1M input, $12/1M output (Tier 1 rates)
          "chat-model": defaultModel,
          "title-model": google("gemini-2.5-flash"), // Fast model for titles
          "artifact-model": defaultModel,

          // Gemini 2.5 Pro - Previous generation reasoning model
          // Good fallback if Gemini 3 has issues
          "chat-model-pro": google("gemini-2.5-pro"),

          // Gemini 3 Pro - Explicit alias for default
          // 1M context window, best for complex multi-modal tasks
          "chat-model-gemini3": google("gemini-3-pro-preview"),

          // Gemini 2.5 Flash-Lite - Ultra fast and cost-efficient
          // Optimized for high throughput, simple tasks
          "chat-model-flash-lite": google("gemini-2.5-flash-lite"),

          // Gemini 2.5 Flash - Fast with good quality
          // Best price-performance for simpler queries
          "chat-model-flash": google("gemini-2.5-flash"),
        },
      });
    })();
