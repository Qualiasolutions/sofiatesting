import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
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
        "chat-model-sonnet": wrapLanguageModel({
          model: anthropic("claude-sonnet-4-20250514"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "chat-model-gpt4o": openai("gpt-4o"),
        "chat-model-gpt4o-mini": openai("gpt-4o-mini"),
        "chat-model": wrapLanguageModel({
          model: anthropic("claude-sonnet-4-20250514"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "title-model": openai("gpt-4o-mini"),
        "artifact-model": anthropic("claude-sonnet-4-20250514"),
      },
    });
