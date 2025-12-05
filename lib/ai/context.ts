import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { UserType } from "@/app/(auth)/auth";

/**
 * User context that can be injected for non-web channels (WhatsApp, Telegram).
 * This allows tools to access user information without requiring a web session.
 */
export interface AIUserContext {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    type: UserType;
  };
}

// Use AsyncLocalStorage to store context per request without globals
const userContextStorage = new AsyncLocalStorage<AIUserContext>();

/**
 * Run a function with user context injected.
 * Tools can access this context via getUserContext().
 */
export function runWithUserContext<T>(
  context: AIUserContext,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return userContextStorage.run(context, fn);
}

/**
 * Get the current user context.
 * Returns undefined if no context is set (e.g., in web requests where auth() should be used).
 */
export function getUserContext(): AIUserContext | undefined {
  return userContextStorage.getStore();
}

/**
 * Check if there is an active user context.
 */
export function hasUserContext(): boolean {
  return userContextStorage.getStore() !== undefined;
}
