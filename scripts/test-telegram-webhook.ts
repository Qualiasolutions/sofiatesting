/**
 * Test Telegram webhook locally
 * Simulates a Telegram message and sends it to the local webhook endpoint
 */

const TELEGRAM_TEST_MESSAGE = {
  update_id: 123456789,
  message: {
    message_id: 1,
    from: {
      id: 123456,
      is_bot: false,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
    },
    chat: {
      id: 123456,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      type: "private",
    },
    date: Math.floor(Date.now() / 1000),
    text: "Hello SOFIA!",
  },
};

async function testTelegramWebhook() {
  const webhookUrl = "http://localhost:3001/api/telegram/webhook";

  console.log("🧪 Testing Telegram Webhook");
  console.log("URL:", webhookUrl);
  console.log("Message:", TELEGRAM_TEST_MESSAGE.message.text);
  console.log();

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(TELEGRAM_TEST_MESSAGE),
    });

    console.log("Response status:", response.status, response.statusText);
    const data = await response.json();
    console.log("Response body:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ Webhook test PASSED");
    } else {
      console.log("\n❌ Webhook test FAILED");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  }
}

testTelegramWebhook();
