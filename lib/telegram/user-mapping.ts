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
    console.error("Error getting Telegram user:", error);
    throw new Error("Failed to get or create user for Telegram");
  }
}

/**
 * Get or create a chat session for a Telegram user
 */
export function getTelegramChatId(telegramUserId: number): string {
  // Use a consistent chat ID based on Telegram user ID
  // This creates a single persistent conversation per Telegram user
  return `telegram_${telegramUserId}_chat`;
}
