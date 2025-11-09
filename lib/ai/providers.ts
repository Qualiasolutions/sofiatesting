import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from "ai";
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
        // Gemini models (via Google AI SDK) - fallback option
        "chat-model-gemini": google("gemini-1.5-flash-latest"),
        // AI Gateway models (OpenAI and Anthropic automatically use AI Gateway on Vercel)
        "chat-model": openai("gpt-4o-mini"), // Default model (fast & cheap)
        "title-model": openai("gpt-4o-mini"), // Title generation
        "artifact-model": openai("gpt-4o-mini"), // Artifact generation
        "chat-model-sonnet": wrapLanguageModel({
          model: anthropic("claude-sonnet-4.5"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "chat-model-haiku": anthropic("claude-3-5-haiku-20241022"),
        "chat-model-gpt4o": openai("gpt-4o"),
        "chat-model-gpt4o-mini": openai("gpt-4o-mini"),
      },
    });
