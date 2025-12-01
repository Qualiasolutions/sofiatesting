/**
 * Script to check and set up Telegram webhook
 * Usage: tsx scripts/check-telegram-webhook.ts
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL =
  process.env.WEBHOOK_URL ||
  "https://sofiatesting.vercel.app/api/telegram/webhook";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN environment variable is not set");
  process.exit(1);
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function checkWebhook() {
  console.log("🔍 Checking Telegram webhook status...\n");

  try {
    // Get current webhook info
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    const data = await response.json();

    if (!data.ok) {
      console.error("❌ Failed to get webhook info:", data);
      return;
    }

    const info = data.result;

    console.log("📊 Current Webhook Status:");
    console.log("  URL:", info.url || "(not set)");
    console.log("  Pending updates:", info.pending_update_count);
    console.log("  Max connections:", info.max_connections);
    console.log(
      "  Allowed updates:",
      info.allowed_updates?.join(", ") || "all"
    );

    if (info.last_error_date) {
      const errorDate = new Date(info.last_error_date * 1000);
      console.log("\n⚠️  Last Error:");
      console.log("  Date:", errorDate.toISOString());
      console.log("  Message:", info.last_error_message);
    }

    if (info.last_synchronization_error_date) {
      const syncErrorDate = new Date(
        info.last_synchronization_error_date * 1000
      );
      console.log("\n⚠️  Last Synchronization Error:");
      console.log("  Date:", syncErrorDate.toISOString());
    }

    // Check if webhook URL matches expected
    const expectedUrl = WEBHOOK_URL;
    if (info.url === expectedUrl) {
      console.log("\n✅ Webhook is correctly configured!");
    } else if (info.url) {
      console.log("\n⚠️  Webhook URL mismatch:");
      console.log(`  Expected: ${expectedUrl}`);
      console.log(`  Current:  ${info.url}`);
      console.log("\n  Run with --set flag to update it.");
    } else {
      console.log(
        "\n⚠️  Webhook is NOT set. Run with --set flag to configure it."
      );
    }
  } catch (error) {
    console.error("❌ Error checking webhook:", error);
  }
}

async function setWebhook() {
  console.log("🔧 Setting up Telegram webhook...\n");

  try {
    const webhookUrl = WEBHOOK_URL;
    console.log("  Target URL:", webhookUrl);

    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "edited_message"],
        drop_pending_updates: false,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log("✅ Webhook set successfully!");
      console.log("\nVerifying...");
      await checkWebhook();
    } else {
      console.error("❌ Failed to set webhook:", data);
    }
  } catch (error) {
    console.error("❌ Error setting webhook:", error);
  }
}

async function getBotInfo() {
  console.log("🤖 Getting bot information...\n");

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await response.json();

    if (data.ok) {
      const bot = data.result;
      console.log("📋 Bot Information:");
      console.log("  Username:", `@${bot.username}`);
      console.log("  Name:", bot.first_name);
      console.log("  ID:", bot.id);
      console.log("  Can join groups:", bot.can_join_groups);
      console.log("  Can read messages:", bot.can_read_all_group_messages);
      console.log("\n");
    } else {
      console.error("❌ Failed to get bot info:", data);
    }
  } catch (error) {
    console.error("❌ Error getting bot info:", error);
  }
}

// Main
const args = process.argv.slice(2);

async function main() {
  await getBotInfo();

  if (args.includes("--set")) {
    await setWebhook();
  } else {
    await checkWebhook();
    console.log("\n💡 Tip: Run with --set flag to configure the webhook");
  }
}

main();
