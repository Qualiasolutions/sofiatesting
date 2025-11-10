import { google } from "@ai-sdk/google";
import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, claudeModel, mistralSmallModel } =
        require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": claudeModel,
          "chat-model-sonnet": claudeModel,
          "chat-model-gpt4o": chatModel,
          "chat-model-gpt4o-mini": mistralSmallModel,
          "title-model": mistralSmallModel,
          "artifact-model": claudeModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // Primary models: Gemini 1.5 Flash (fast, cost-effective)
        "chat-model": google("gemini-1.5-flash-latest"), // Default model - 50% cheaper than GPT-4o-mini
        "title-model": google("gemini-1.5-flash-latest"), // Title generation
        "artifact-model": google("gemini-1.5-flash-latest"), // Artifact generation

        // Premium models via AI Gateway (optional, requires AI_GATEWAY_API_KEY)
        "chat-model-gpt4o-mini": gateway("openai/gpt-4o-mini"),
        "chat-model-gpt4o": gateway("openai/gpt-4o"),
        "chat-model-sonnet": wrapLanguageModel({
          model: gateway("anthropic/claude-sonnet-4.5"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "chat-model-haiku": gateway("anthropic/claude-3-5-haiku-20241022"),
      },
    });
