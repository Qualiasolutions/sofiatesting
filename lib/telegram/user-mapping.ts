import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { user } from "../db/schema";
import { generateHashedPassword } from "../db/utils";
import { generateUUID } from "../utils";
import type { TelegramUser } from "./types";

/**
 * Map Telegram user to database user
 * Creates a user if they don't exist
 */
export async function getTelegramUser(
  telegramUser: TelegramUser
): Promise<{ id: string; email: string }> {
  // Create a unique email based on Telegram user ID
  const email = `telegram_${telegramUser.id}@sofia.bot`;

  try {
    // Check if user exists
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (existingUsers.length > 0) {
      return existingUsers[0];
    }

    // Create new user for this Telegram user
    const password = generateHashedPassword(generateUUID());
    const [newUser] = await db
      .insert(user)
      .values({ email, password })
      .returning({ id: user.id, email: user.email });

    console.log(
      `Created new user for Telegram user @${telegramUser.username || telegramUser.first_name} (ID: ${telegramUser.id})`
    );

    return newUser;
  } catch (error) {
    console.error("Error getting Telegram user:", {
      telegramUserId: telegramUser.id,
      telegramUsername: telegramUser.username,
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error("Failed to get or create user for Telegram");
  }
}

/**
 * Get or create a chat session for a Telegram user
 */
export function getTelegramChatId(telegramUserId: number): string {
  // Generate a deterministic UUID based on Telegram user ID
  // This creates a single persistent conversation per Telegram user
  // Use namespace UUID v5 to create a valid UUID from the Telegram ID
  const crypto = require("crypto");
  const namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // DNS namespace UUID
  const name = `telegram_user_${telegramUserId}`;

  // Create deterministic UUID v5
  const hash = crypto.createHash("sha1");
  hash.update(namespace.replace(/-/g, ""));
  hash.update(name);
  const digest = hash.digest();

  // Format as UUID v5
  const uuid = [
    digest.subarray(0, 4).toString("hex"),
    digest.subarray(4, 6).toString("hex"),
    digest.subarray(6, 8).toString("hex"),
    digest.subarray(8, 10).toString("hex"),
    digest.subarray(10, 16).toString("hex"),
  ].join("-");

  return uuid;
}
