#!/usr/bin/env node
/**
 * Simple script to check Telegram webhook status
 * Usage: TELEGRAM_BOT_TOKEN=your_token node scripts/check-webhook.mjs
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://sofiatesting.vercel.app/api/telegram/webhook";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN environment variable is required");
  console.log("\nUsage:");
  console.log("  TELEGRAM_BOT_TOKEN=your_token node scripts/check-webhook.mjs");
  console.log("  TELEGRAM_BOT_TOKEN=your_token node scripts/check-webhook.mjs --set");
  process.exit(1);
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

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
      console.log("\n");
      return true;
    } else {
      console.error("❌ Failed to get bot info:", data.description || "Unknown error");
      console.log("\n⚠️  Possible reasons:");
      console.log("  - Invalid bot token");
      console.log("  - Network connectivity issues");
      return false;
    }
  } catch (error) {
    console.error("❌ Error getting bot info:", error.message);
    return false;
  }
}

async function checkWebhook() {
  console.log("🔍 Checking Telegram webhook status...\n");

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    const data = await response.json();

    if (!data.ok) {
      console.error("❌ Failed to get webhook info:", data.description);
      return false;
    }

    const info = data.result;

    console.log("📊 Current Webhook Status:");
    console.log("  URL:", info.url || "(not set)");
    console.log("  Pending updates:", info.pending_update_count);
    console.log("  Max connections:", info.max_connections || 40);

    if (info.ip_address) {
      console.log("  IP address:", info.ip_address);
    }

    if (info.last_error_date) {
      const errorDate = new Date(info.last_error_date * 1000);
      console.log("\n⚠️  Last Error:");
      console.log("  Date:", errorDate.toISOString());
      console.log("  Message:", info.last_error_message);
    }

    if (info.last_synchronization_error_date) {
      const syncErrorDate = new Date(info.last_synchronization_error_date * 1000);
      console.log("\n⚠️  Last Synchronization Error:");
      console.log("  Date:", syncErrorDate.toISOString());
    }

    const expectedUrl = WEBHOOK_URL;
    if (info.url === expectedUrl) {
      console.log("\n✅ Webhook is correctly configured!");
      return true;
    } else if (!info.url) {
      console.log("\n⚠️  Webhook is NOT set.");
      console.log("  Run with --set flag to configure it:");
      console.log(`  TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN} node scripts/check-webhook.mjs --set`);
      return false;
    } else {
      console.log(`\n⚠️  Webhook URL mismatch:`);
      console.log(`  Expected: ${expectedUrl}`);
      console.log(`  Current:  ${info.url}`);
      console.log("\n  Run with --set flag to update it.");
      return false;
    }

  } catch (error) {
    console.error("❌ Error checking webhook:", error.message);
    return false;
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
      console.log("  Description:", data.description);
      console.log("\nVerifying configuration...\n");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return await checkWebhook();
    } else {
      console.error("❌ Failed to set webhook:", data.description);
      return false;
    }

  } catch (error) {
    console.error("❌ Error setting webhook:", error.message);
    return false;
  }
}

// Main
const args = process.argv.slice(2);

async function main() {
  const botOk = await getBotInfo();
  if (!botOk) {
    console.log("\n❌ Cannot proceed without valid bot token");
    process.exit(1);
  }

  if (args.includes("--set")) {
    const success = await setWebhook();
    process.exit(success ? 0 : 1);
  } else {
    const success = await checkWebhook();
    if (!success) {
      console.log("\n💡 Tip: Run with --set flag to configure the webhook");
    }
    process.exit(success ? 0 : 1);
  }
}

main();
