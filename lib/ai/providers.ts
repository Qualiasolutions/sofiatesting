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
        // Removed gemini, now using GPT-4o-mini as default via gateway
        "chat-model-gemini": gateway("openai/gpt-4o-mini"), // Keeping ID for compatibility
        "chat-model-sonnet": wrapLanguageModel({
          model: gateway("anthropic/claude-sonnet-4.5"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "chat-model-haiku": gateway("anthropic/claude-3-5-haiku-20241022"),
        "chat-model-gpt4o": gateway("openai/gpt-4o"),
        "chat-model-gpt4o-mini": gateway("openai/gpt-4o-mini"),
        "chat-model": gateway("openai/gpt-4o-mini"), // Default model
        "title-model": gateway("openai/gpt-4o-mini"), // Title generation
        "artifact-model": gateway("openai/gpt-4o-mini"), // Artifact generation
      },
    });
