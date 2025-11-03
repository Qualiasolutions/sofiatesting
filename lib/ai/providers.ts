import { gateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
        geminiModel,
        claudeModel,
        mistralSmallModel,
        mistralMediumModel,
        mistralLargeModel,
        codestralModel,
        pixtralLargeModel,
      } = require("./models.mock");
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
        "chat-model-gemini": google("gemini-2.0-flash-exp"),
        "chat-model-sonnet": wrapLanguageModel({
          model: gateway("anthropic/claude-sonnet-4.5"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "chat-model-haiku": gateway("anthropic/claude-3-5-haiku-20241022"),
        "chat-model-gpt4o": gateway("openai/gpt-4o"),
        "chat-model-gpt4o-mini": gateway("openai/gpt-4o-mini"),
        "chat-model": google("gemini-2.0-flash-exp"),
        "title-model": google("gemini-2.0-flash-exp"),
        "artifact-model": google("gemini-2.0-flash-exp"),
      },
    });
