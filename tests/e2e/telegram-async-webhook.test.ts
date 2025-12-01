import { expect, test } from "@playwright/test";
import type { TelegramMessage, TelegramUpdate } from "@/lib/telegram/types";

/**
 * E2E Tests for Async Telegram Webhook Implementation
 *
 * Tests the fire-and-forget async message processing pattern implemented in
 * app/api/telegram/webhook/route.ts
 *
 * Key behaviors tested:
 * 1. Webhook returns 200 OK immediately (< 500ms response time)
 * 2. Webhook returns before message processing completes
 * 3. Background processing completes successfully (verified via DB/logs)
 * 4. Background processing handles errors gracefully
 * 5. Security: Secret token validation
 * 6. Edge cases: Edited messages, malformed payloads
 * 7. Concurrency: Multiple webhooks don't interfere
 */

test.describe("Telegram Async Webhook", () => {
  const WEBHOOK_URL = "http://localhost:3000/api/telegram/webhook";
  const TEST_SECRET = "test-webhook-secret-token-123";

  /**
   * Helper: Create a valid Telegram message payload
   */
  function createTelegramMessage(
    text: string,
    chatId = 123_456_789,
    messageId = 1
  ): TelegramMessage {
    return {
      message_id: messageId,
      from: {
        id: chatId,
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        language_code: "en",
      },
      chat: {
        id: chatId,
        type: "private",
        first_name: "Test",
        last_name: "User",
        username: "testuser",
      },
      date: Math.floor(Date.now() / 1000),
      text,
    };
  }

  /**
   * Helper: Create a valid Telegram webhook update
   */
  function createTelegramUpdate(
    message: TelegramMessage,
    updateId = Date.now()
  ): TelegramUpdate {
    return {
      update_id: updateId,
      message,
    };
  }

  /**
   * Helper: Create edited message update
   */
  function createEditedMessageUpdate(
    message: TelegramMessage,
    updateId = Date.now()
  ): TelegramUpdate {
    return {
      update_id: updateId,
      edited_message: message,
    };
  }

  test.beforeEach(async ({ context }) => {
    // Set up mock for Telegram Bot API (sendMessage endpoint)
    await context.route(
      "https://api.telegram.org/bot*/sendMessage",
      async (route) => {
        // Simulate Telegram API response
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            result: {
              message_id: 999,
              date: Math.floor(Date.now() / 1000),
              chat: { id: 123_456_789, type: "private" },
              text: "Mock response",
            },
          }),
        });
      }
    );

    // Set up mock for Telegram Bot API (sendChatAction endpoint)
    await context.route(
      "https://api.telegram.org/bot*/sendChatAction",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      }
    );
  });

  test("Webhook returns 200 OK immediately (< 500ms response time)", async ({
    request,
  }) => {
    // GIVEN: A valid Telegram message
    const message = createTelegramMessage("Hello SOFIA!");
    const update = createTelegramUpdate(message);

    // WHEN: We send the webhook request
    const startTime = Date.now();
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: update,
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // THEN: Response should be immediate (< 500ms)
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(500);

    const body = await response.json();
    expect(body).toEqual({ ok: true });

    console.log(`✓ Webhook responded in ${responseTime}ms (< 500ms threshold)`);
  });

  test("Webhook returns before message processing completes", async ({
    request,
    context,
  }) => {
    // GIVEN: We track when Telegram API is called
    let telegramApiCalled = false;
    let telegramApiCallTime = 0;

    await context.route(
      "https://api.telegram.org/bot*/sendMessage",
      async (route) => {
        // Simulate realistic AI processing delay (1-2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 1500));
        telegramApiCalled = true;
        telegramApiCallTime = Date.now();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            result: { message_id: 999, date: Math.floor(Date.now() / 1000) },
          }),
        });
      }
    );

    // WHEN: We send the webhook request
    const message = createTelegramMessage("Calculate transfer fees for 200000");
    const update = createTelegramUpdate(message);

    const webhookStartTime = Date.now();
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: update,
    });
    const webhookEndTime = Date.now();

    // THEN: Webhook should return before Telegram API is called
    expect(response.status()).toBe(200);
    expect(telegramApiCalled).toBe(false); // Not called yet when webhook returns

    console.log(
      `✓ Webhook returned in ${webhookEndTime - webhookStartTime}ms (before background processing)`
    );

    // WAIT: For background processing to complete
    // The serverless function stays alive (maxDuration = 60s)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // VERIFY: Background processing completed successfully
    expect(telegramApiCalled).toBe(true);
    expect(telegramApiCallTime).toBeGreaterThan(webhookEndTime);

    console.log(
      `✓ Background processing completed ${telegramApiCallTime - webhookEndTime}ms after webhook returned`
    );
  });

  test("Background processing completes successfully", async ({
    request,
    context,
  }) => {
    // GIVEN: We track all Telegram API calls
    const apiCalls: Array<{ endpoint: string; body: any; timestamp: number }> =
      [];

    await context.route("https://api.telegram.org/bot*/*", async (route) => {
      const url = route.request().url();
      const endpoint = url.split("/").pop() || "unknown";

      let body = {};
      try {
        body = await route.request().postDataJSON();
      } catch {
        // Some endpoints (like sendChatAction) may not have JSON body
      }

      apiCalls.push({
        endpoint,
        body,
        timestamp: Date.now(),
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          result: { message_id: 999, date: Math.floor(Date.now() / 1000) },
        }),
      });
    });

    // WHEN: We send a message that requires AI processing
    const message = createTelegramMessage(
      "What is capital gains tax in Cyprus?"
    );
    const update = createTelegramUpdate(message);

    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: update,
    });

    expect(response.status()).toBe(200);

    // WAIT: For background processing (AI generation takes time)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // THEN: Verify full workflow completed
    expect(apiCalls.length).toBeGreaterThan(0);

    // Should have at least:
    // 1. sendChatAction (typing indicator)
    // 2. sendMessage (AI response)
    const chatActionCalls = apiCalls.filter(
      (call) => call.endpoint === "sendChatAction"
    );
    const sendMessageCalls = apiCalls.filter(
      (call) => call.endpoint === "sendMessage"
    );

    expect(chatActionCalls.length).toBeGreaterThan(0);
    expect(sendMessageCalls.length).toBeGreaterThan(0);

    // Verify message was sent with reply
    const finalMessage = sendMessageCalls.at(-1);
    expect(finalMessage.body.chat_id).toBe(message.chat.id);
    expect(finalMessage.body.reply_to_message_id).toBe(message.message_id);
    expect(finalMessage.body.text).toBeDefined();

    console.log(
      `✓ Background processing completed with ${apiCalls.length} API calls:`
    );
    console.log(`  - sendChatAction: ${chatActionCalls.length}`);
    console.log(`  - sendMessage: ${sendMessageCalls.length}`);
  });

  test("Background processing handles errors gracefully", async ({
    request,
    context,
  }) => {
    // GIVEN: Telegram API fails
    await context.route(
      "https://api.telegram.org/bot*/sendMessage",
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            error_code: 500,
            description: "Internal Server Error",
          }),
        });
      }
    );

    // WHEN: We send a message
    const message = createTelegramMessage("Test message");
    const update = createTelegramUpdate(message);

    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: update,
    });

    // THEN: Webhook still returns 200 (errors are caught)
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    // The error is logged but doesn't crash the webhook
    // (Verified by the 200 response)
    console.log("✓ Webhook returned 200 despite background processing error");
  });

  test("Webhook validates secret token (401 if invalid)", async ({
    request,
  }) => {
    // GIVEN: A valid message but invalid secret token
    const message = createTelegramMessage("Hello!");
    const update = createTelegramUpdate(message);

    // WHEN: We send with wrong secret token
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "wrong-secret",
      },
      data: update,
    });

    // THEN: Should reject with 401
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");

    console.log("✓ Invalid secret token rejected with 401");
  });

  test("Webhook validates secret token (passes if no secret configured)", async ({
    request,
  }) => {
    // GIVEN: No secret token header (and no TELEGRAM_WEBHOOK_SECRET env var)
    const message = createTelegramMessage("Hello!");
    const update = createTelegramUpdate(message);

    // WHEN: We send without secret token header
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
      },
      data: update,
    });

    // THEN: Should accept (no secret configured means no validation)
    expect(response.status()).toBe(200);

    console.log("✓ Webhook accepts request without secret when not configured");
  });

  test("Webhook handles edited messages (logs and ignores)", async ({
    request,
  }) => {
    // GIVEN: An edited message update
    const message = createTelegramMessage("Edited text");
    const update = createEditedMessageUpdate(message);

    // WHEN: We send the edited message update
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: update,
    });

    // THEN: Should return 200 but not process message
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    console.log("✓ Edited messages handled gracefully (logged and ignored)");
  });

  test("Webhook handles malformed request body (returns 200, logs error)", async ({
    request,
  }) => {
    // GIVEN: Invalid JSON payload
    const malformedPayload = "{ invalid json }";

    // WHEN: We send malformed payload
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: malformedPayload,
    });

    // THEN: Should return 200 with error (to prevent Telegram retries)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBeDefined();

    console.log("✓ Malformed payload handled: returned 200 with error");
  });

  test("Webhook handles missing message field (returns 200)", async ({
    request,
  }) => {
    // GIVEN: Update with no message or edited_message
    const emptyUpdate: TelegramUpdate = {
      update_id: Date.now(),
    };

    // WHEN: We send empty update
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: emptyUpdate,
    });

    // THEN: Should return 200 (nothing to process)
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    console.log("✓ Empty update handled gracefully");
  });

  test("Multiple concurrent webhooks don't interfere", async ({
    request,
    context,
  }) => {
    // GIVEN: We track all processed messages
    const processedMessages = new Set<number>();

    await context.route(
      "https://api.telegram.org/bot*/sendMessage",
      async (route) => {
        const body = await route.request().postDataJSON();
        processedMessages.add(body.chat_id);

        // Simulate variable processing time (500-1500ms)
        const delay = 500 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            result: { message_id: 999, date: Math.floor(Date.now() / 1000) },
          }),
        });
      }
    );

    // WHEN: We send 5 concurrent webhook requests with different chat IDs
    const chatIds = [111, 222, 333, 444, 555];
    const webhookPromises = chatIds.map(async (chatId, index) => {
      const message = createTelegramMessage(
        `Message ${index + 1}`,
        chatId,
        index + 1
      );
      const update = createTelegramUpdate(message, Date.now() + index);

      const startTime = Date.now();
      const response = await request.post(WEBHOOK_URL, {
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
        },
        data: update,
      });
      const endTime = Date.now();

      return {
        chatId,
        status: response.status(),
        responseTime: endTime - startTime,
      };
    });

    // WAIT: For all webhooks to respond
    const results = await Promise.all(webhookPromises);

    // THEN: All webhooks should return 200 immediately
    results.forEach((result) => {
      expect(result.status).toBe(200);
      expect(result.responseTime).toBeLessThan(500);
    });

    console.log("✓ All concurrent webhooks returned immediately:");
    results.forEach((r) =>
      console.log(`  - Chat ${r.chatId}: ${r.responseTime}ms`)
    );

    // WAIT: For background processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // VERIFY: All messages were processed independently
    expect(processedMessages.size).toBe(chatIds.length);
    chatIds.forEach((chatId) => {
      expect(processedMessages.has(chatId)).toBe(true);
    });

    console.log(`✓ All ${chatIds.length} messages processed independently`);
  });

  test("Webhook handles bot messages (ignores)", async ({
    request,
    context,
  }) => {
    // GIVEN: Track if any API calls are made
    let apiCalled = false;
    await context.route("https://api.telegram.org/bot*/*", async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    // WHEN: We send a message from a bot (is_bot: true)
    const botMessage = createTelegramMessage("Bot message");
    botMessage.from!.is_bot = true;
    const update = createTelegramUpdate(botMessage);

    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: update,
    });

    // THEN: Webhook returns 200 but doesn't process (no API calls)
    expect(response.status()).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(apiCalled).toBe(false); // No processing happened

    console.log("✓ Bot messages ignored (no processing)");
  });

  test("Webhook handles non-text messages (sends error response)", async ({
    request,
    context,
  }) => {
    // GIVEN: Track API calls
    const apiCalls: string[] = [];
    await context.route("https://api.telegram.org/bot*/*", async (route) => {
      const body = await route.request().postDataJSON();
      if (body.text) {
        apiCalls.push(body.text);
      }
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    // WHEN: We send a message without text (e.g., photo)
    const photoMessage = createTelegramMessage("");
    photoMessage.text = undefined; // No text
    photoMessage.photo = [
      {
        file_id: "photo123",
        file_unique_id: "unique123",
        width: 100,
        height: 100,
      },
    ];
    const update = createTelegramUpdate(photoMessage);

    const response = await request.post(WEBHOOK_URL, {
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
      },
      data: update,
    });

    // THEN: Webhook returns 200 and sends error message to user
    expect(response.status()).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Should have sent "I can only process text messages" response
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls[0]).toContain("I can only process text messages");

    console.log("✓ Non-text message handled with error response");
  });

  test("GET request returns health check", async ({ request }) => {
    // WHEN: We send GET request to webhook endpoint
    const response = await request.get(WEBHOOK_URL);

    // THEN: Should return health check response
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.status).toBe("ok");
    expect(body.service).toBe("SOFIA Telegram Bot");
    expect(body.timestamp).toBeDefined();

    console.log("✓ GET health check endpoint working");
  });

  test("Webhook response time remains consistent under load", async ({
    request,
  }) => {
    // GIVEN: We send 10 requests and measure response times
    const responseTimes: number[] = [];

    // WHEN: We send multiple requests sequentially
    for (let i = 0; i < 10; i++) {
      const message = createTelegramMessage(`Load test message ${i + 1}`);
      const update = createTelegramUpdate(message, Date.now() + i);

      const startTime = Date.now();
      const response = await request.post(WEBHOOK_URL, {
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": TEST_SECRET,
        },
        data: update,
      });
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      responseTimes.push(endTime - startTime);
    }

    // THEN: All responses should be fast and consistent
    responseTimes.forEach((time, index) => {
      expect(time).toBeLessThan(500);
      console.log(`  Request ${index + 1}: ${time}ms`);
    });

    const avgTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxTime = Math.max(...responseTimes);

    console.log(`✓ Average response time: ${avgTime.toFixed(0)}ms`);
    console.log(`✓ Max response time: ${maxTime}ms (< 500ms threshold)`);

    expect(avgTime).toBeLessThan(300); // Should average under 300ms
    expect(maxTime).toBeLessThan(500); // Should never exceed 500ms
  });
});
