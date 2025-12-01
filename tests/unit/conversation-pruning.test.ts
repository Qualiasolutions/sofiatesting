import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  estimatePruningSavings,
  getMaxConversationMessages,
  pruneConversationHistory,
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

  before(() => {
    originalEnv = process.env.MAX_CONVERSATION_MESSAGES;
  });

  after(() => {
    if (originalEnv !== undefined) {
      process.env.MAX_CONVERSATION_MESSAGES = originalEnv;
    } else {
      process.env.MAX_CONVERSATION_MESSAGES = undefined;
    }
  });

  describe("getMaxConversationMessages", () => {
    it("should return default (10) when env var not set", () => {
      process.env.MAX_CONVERSATION_MESSAGES = undefined;
      assert.strictEqual(getMaxConversationMessages(), 10);
    });

    it("should use env var when set", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "15";
      assert.strictEqual(getMaxConversationMessages(), 15);
    });

    it("should return default for invalid env var", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "invalid";
      assert.strictEqual(getMaxConversationMessages(), 10);
    });

    it("should return default for env var < 2", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "1";
      assert.strictEqual(getMaxConversationMessages(), 10);
    });
  });

  describe("pruneConversationHistory", () => {
    it("should not prune when messages <= limit", () => {
      process.env.MAX_CONVERSATION_MESSAGES = undefined; // Reset to default
      const messages = Array.from({ length: 5 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      assert.strictEqual(pruned.length, 5);
      assert.deepStrictEqual(pruned, messages);
    });

    it("should keep exactly limit messages when above limit", () => {
      process.env.MAX_CONVERSATION_MESSAGES = undefined; // Reset to default
      const messages = Array.from({ length: 15 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      assert.strictEqual(pruned.length, 10); // Default limit
    });

    it("should keep first message", () => {
      process.env.MAX_CONVERSATION_MESSAGES = undefined; // Reset to default
      const messages = Array.from({ length: 20 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      assert.strictEqual(pruned[0].id, "msg-0"); // First message
    });

    it("should keep last N-1 messages", () => {
      process.env.MAX_CONVERSATION_MESSAGES = undefined; // Reset to default
      const messages = Array.from({ length: 20 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      // Should have first (msg-0) + last 9 (msg-11 through msg-19)
      assert.strictEqual(pruned.length, 10);
      assert.strictEqual(pruned[0].id, "msg-0");
      assert.strictEqual(pruned[1].id, "msg-11");
      assert.strictEqual(pruned[9].id, "msg-19");
    });

    it("should respect custom limit via env var", () => {
      process.env.MAX_CONVERSATION_MESSAGES = "5";
      const messages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      assert.strictEqual(pruned.length, 5);
      assert.strictEqual(pruned[0].id, "msg-0"); // First
      assert.strictEqual(pruned[1].id, "msg-6"); // Last 4 start here
      assert.strictEqual(pruned[4].id, "msg-9"); // Last
    });

    it("should handle edge case of exactly limit messages", () => {
      process.env.MAX_CONVERSATION_MESSAGES = undefined; // Reset to default
      const messages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(i)
      );
      const pruned = pruneConversationHistory(messages);

      assert.strictEqual(pruned.length, 10);
      assert.deepStrictEqual(pruned, messages); // No pruning needed
    });
  });

  describe("estimatePruningSavings", () => {
    it("should calculate token savings correctly", () => {
      const savings = estimatePruningSavings(20, 10); // 10 messages saved
      assert.strictEqual(savings, 1500); // 10 * 150 tokens
    });

    it("should use custom avg tokens per message", () => {
      const savings = estimatePruningSavings(20, 10, 200);
      assert.strictEqual(savings, 2000); // 10 * 200 tokens
    });

    it("should return 0 when no pruning occurred", () => {
      const savings = estimatePruningSavings(5, 5);
      assert.strictEqual(savings, 0);
    });
  });
});
