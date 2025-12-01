/**
 * Setup Telegram webhook for production
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL =
  "https://sofiatesting-ogj0npcn8-qualiasolutionscy.vercel.app/api/telegram/webhook";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN not found in environment");
  process.exit(1);
}

async function setupWebhook() {
  console.log("🔧 Setting up Telegram Webhook\n");

  // Check current webhook info
  console.log("📋 Checking current webhook info...");
  const infoResponse = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
  );
  const infoData = await infoResponse.json();

  if (infoData.ok) {
    console.log("Current webhook:", JSON.stringify(infoData.result, null, 2));
    console.log();
  }

  // Set new webhook
  console.log(`🔗 Setting webhook to: ${WEBHOOK_URL}`);
  const setResponse = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ["message", "edited_message"],
        drop_pending_updates: false,
      }),
    }
  );

  const setData = await setResponse.json();

  if (setData.ok) {
    console.log("✅ Webhook set successfully!");
    console.log("Response:", JSON.stringify(setData, null, 2));
  } else {
    console.error("❌ Failed to set webhook");
    console.error("Error:", JSON.stringify(setData, null, 2));
    process.exit(1);
  }

  // Verify webhook was set
  console.log("\n📋 Verifying webhook...");
  const verifyResponse = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
  );
  const verifyData = await verifyResponse.json();

  if (verifyData.ok) {
    console.log("Webhook info:", JSON.stringify(verifyData.result, null, 2));

    if (verifyData.result.url === WEBHOOK_URL) {
      console.log("\n✅ WEBHOOK SETUP COMPLETE!");
      console.log("\n🎯 You can now send messages to your Telegram bot!");
    } else {
      console.warn("\n⚠️  Webhook URL doesn't match. Expected:", WEBHOOK_URL);
      console.warn("Got:", verifyData.result.url);
    }
  }
}

setupWebhook().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
