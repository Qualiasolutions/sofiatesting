/**
 * Test production Telegram webhook
 */

const PRODUCTION_WEBHOOK_URL =
  "https://sofiatesting-ogj0npcn8-qualiasolutionscy.vercel.app/api/telegram/webhook";

const TEST_MESSAGE = {
  update_id: 999_999_999,
  message: {
    message_id: 999,
    from: {
      id: 999_999,
      is_bot: false,
      first_name: "ProductionTest",
      username: "prodtest",
    },
    chat: {
      id: 999_999,
      type: "private",
    },
    date: Math.floor(Date.now() / 1000),
    text: "Hello SOFIA production test!",
  },
};

async function testProductionWebhook() {
  console.log("🧪 Testing Production Telegram Webhook");
  console.log("URL:", PRODUCTION_WEBHOOK_URL);
  console.log("Message:", TEST_MESSAGE.message.text);
  console.log();

  try {
    const response = await fetch(PRODUCTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(TEST_MESSAGE),
    });

    console.log("Response status:", response.status, response.statusText);
    const data = await response.json();
    console.log("Response body:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ Production webhook test PASSED");
      console.log("\nNOTE: Check your Telegram bot for the response message!");
      console.log(
        "(The error message is expected if TELEGRAM_BOT_TOKEN is not valid in production)"
      );
    } else {
      console.log("\n❌ Production webhook test FAILED");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  }
}

testProductionWebhook();
