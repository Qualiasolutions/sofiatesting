import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  pruneConversationHistory,
  getMaxConversationMessages,
  estimatePruningSavings,
} from "@/lib/ai/conversation-pruning";
import type { ChatMessage } from "@/lib/types";

// Helper to create mock messages
function createMockMessage(id: number): ChatMessage {
  return {
    id: `msg-${id}`,
    role: id % 2 === 0 ? "user" : "assistant",
    parts: [{ type: "text", text: `Message ${id}` }],
  };
}

describe("Conversation Pruning", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.MAX_CONVERSATION_MESSAGES;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.MAX_CONVERSATION_MESSAGES = originalEnv;
    } else {
      delete process.env.MAX_CONVERSATION_MESSAGES;
    }
  });

  describe("getMaxConversationMessages", () => {
    it("should return default (10) when env var not set", () => {
      delete process.env.MAX_CONVERSATION_MESSAGES;
      expect(getMaxConversationMessages()).toBe(10);
    });

    it("should use env var when set", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "15";
      expect(getMaxConversationMessages()).toBe(15);
    });

    it("should return default for invalid env var", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "invalid";
      expect(getMaxConversationMessages()).toBe(10);
    });

    it("should return default for env var < 2", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "1";
      expect(getMaxConversationMessages()).toBe(10);
    });
  });

  describe("pruneConversationHistory", () => {
    it("should not prune when messages <= limit", () => {
      const messages = Array.from({ length: 5 }, (_, i) => createMockMessage(i));
      const pruned = pruneConversationHistory(messages);

      expect(pruned.length).toBe(5);
      expect(pruned).toEqual(messages);
    });

    it("should keep exactly limit messages when above limit", () => {
      const messages = Array.from({ length: 15 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      expect(pruned.length).toBe(10); // Default limit
    });

    it("should keep first message", () => {
      const messages = Array.from({ length: 20 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      expect(pruned[0].id).toBe("msg-0"); // First message
    });

    it("should keep last N-1 messages", () => {
      const messages = Array.from({ length: 20 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      // Should have first (msg-0) + last 9 (msg-11 through msg-19)
      expect(pruned.length).toBe(10);
      expect(pruned[0].id).toBe("msg-0");
      expect(pruned[1].id).toBe("msg-11");
      expect(pruned[9].id).toBe("msg-19");
    });

    it("should respect custom limit via env var", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "5";
      const messages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      expect(pruned.length).toBe(5);
      expect(pruned[0].id).toBe("msg-0"); // First
      expect(pruned[1].id).toBe("msg-6"); // Last 4 start here
      expect(pruned[4].id).toBe("msg-9"); // Last
    });

    it("should handle edge case of exactly limit messages", () => {
      const messages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      expect(pruned.length).toBe(10);
      expect(pruned).toEqual(messages); // No pruning needed
    });
  });

  describe("estimatePruningSavings", () => {
    it("should calculate token savings correctly", () => {
      const savings = estimatePruningSavings(20, 10); // 10 messages saved
      expect(savings).toBe(1500); // 10 * 150 tokens
    });

    it("should use custom avg tokens per message", () => {
      const savings = estimatePruningSavings(20, 10, 200);
      expect(savings).toBe(2000); // 10 * 200 tokens
    });

    it("should return 0 when no pruning occurred", () => {
      const savings = estimatePruningSavings(5, 5);
      expect(savings).toBe(0);
    });
  });
});
