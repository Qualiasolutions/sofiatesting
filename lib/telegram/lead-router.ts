import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  leadForwardingRotation,
  telegramGroup,
  telegramLead,
  zyprusAgent,
} from "../db/schema";
import { getTelegramClient } from "./client";
import type { TelegramMessage } from "./types";

// Top-level regex for lead mention detection
const LEAD_MENTION_PATTERN =
  /\b(lead|client|enquiry|inquiry|interested|viewing|buyer|purchaser)\b/i;

/**
 * Check if the chat type is a group or supergroup
 */
export function isGroupChat(
  chatType: string
): chatType is "group" | "supergroup" {
  return chatType === "group" || chatType === "supergroup";
}

/**
 * Extract property reference IDs from message text
 * Matches patterns like: ZYP-1234, ZYP1234, or zyprus.com/property/xyz links
 */
export function extractPropertyIds(text: string): string[] {
  const ids: string[] = [];

  // Match ZYP-1234 or ZYP1234 patterns
  const refPattern = /ZYP[-]?\d+/gi;
  const refMatches = text.match(refPattern);
  if (refMatches) {
    ids.push(...refMatches.map((m) => m.toUpperCase().replace("-", "-")));
  }

  // Match zyprus.com property links
  const urlPattern =
    /zyprus\.com\/(?:property|properties|listing)\/([a-zA-Z0-9-]+)/gi;
  for (const urlMatch of text.matchAll(urlPattern)) {
    ids.push(urlMatch[1]);
  }

  return [...new Set(ids)]; // Remove duplicates
}

/**
 * Get or create a Telegram group record
 */
async function getOrCreateGroup(
  chatId: number,
  title: string | undefined,
  type: string
): Promise<typeof telegramGroup.$inferSelect | null> {
  try {
    // Try to find existing group
    const [existingGroup] = await db
      .select()
      .from(telegramGroup)
      .where(eq(telegramGroup.groupId, chatId))
      .limit(1);

    if (existingGroup) {
      // Update title if changed
      if (title && existingGroup.groupName !== title) {
        await db
          .update(telegramGroup)
          .set({ groupName: title })
          .where(eq(telegramGroup.id, existingGroup.id));
      }
      return existingGroup;
    }

    // Detect group type from name
    const groupType = detectGroupType(title);

    // Create new group record
    const [newGroup] = await db
      .insert(telegramGroup)
      .values({
        groupId: chatId,
        groupName: title || `Telegram ${type}`,
        groupType,
        region: detectRegionFromName(title),
        isActive: true,
        leadRoutingEnabled: true,
      })
      .returning();

    console.log("Created new Telegram group record:", {
      id: newGroup.id,
      groupName: newGroup.groupName,
      groupId: chatId,
    });

    return newGroup;
  } catch (error) {
    console.error("Error getting/creating Telegram group:", error);
    return null;
  }
}

/**
 * Detect group type from name
 */
function detectGroupType(name: string | undefined): string {
  if (!name) {
    return "others";
  }

  const nameLower = name.toLowerCase();

  if (nameLower.includes("alla") || nameLower.includes("all")) {
    return "all";
  }
  if (nameLower.includes("limassol")) {
    return "limassol";
  }
  if (nameLower.includes("paphos") || nameLower.includes("pafos")) {
    return "paphos";
  }
  if (nameLower.includes("larnaca") || nameLower.includes("larnaka")) {
    return "larnaca";
  }
  if (nameLower.includes("nicosia") || nameLower.includes("lefkosia")) {
    return "nicosia";
  }
  if (nameLower.includes("famagusta") || nameLower.includes("ammochostos")) {
    return "famagusta";
  }

  return "others";
}

/**
 * Detect region from group name
 */
function detectRegionFromName(name: string | undefined): string | null {
  if (!name) {
    return null;
  }

  const nameLower = name.toLowerCase();

  if (nameLower.includes("limassol")) {
    return "Limassol";
  }
  if (nameLower.includes("paphos") || nameLower.includes("pafos")) {
    return "Paphos";
  }
  if (nameLower.includes("larnaca") || nameLower.includes("larnaka")) {
    return "Larnaca";
  }
  if (nameLower.includes("nicosia") || nameLower.includes("lefkosia")) {
    return "Nicosia";
  }
  if (nameLower.includes("famagusta") || nameLower.includes("ammochostos")) {
    return "Famagusta";
  }
  if (nameLower.includes("alla") || nameLower.includes("all")) {
    return "All";
  }

  return null;
}

/**
 * Get the target agent(s) for lead forwarding based on region
 */
async function getTargetAgents(
  region: string | null,
  _propertyId?: string | null
): Promise<(typeof zyprusAgent.$inferSelect)[]> {
  try {
    // For Limassol, get agents with Limassol region
    // For Paphos, get the listing owner or office email
    // For others, get the regional manager

    if (!region || region === "All") {
      // Get all active agents for "All Leads" group
      const agents = await db
        .select()
        .from(zyprusAgent)
        .where(
          and(
            eq(zyprusAgent.isActive, true),
            eq(zyprusAgent.canReceiveLeads, true)
          )
        )
        .limit(5);
      return agents;
    }

    // Get agents for specific region
    const agents = await db
      .select()
      .from(zyprusAgent)
      .where(
        and(
          eq(zyprusAgent.region, region),
          eq(zyprusAgent.isActive, true),
          eq(zyprusAgent.canReceiveLeads, true)
        )
      );

    return agents;
  } catch (error) {
    console.error("Error getting target agents:", error);
    return [];
  }
}

/**
 * Get the next agent in rotation for fair lead distribution
 * Uses round-robin algorithm based on stored rotation state
 */
async function getNextAgentInRotation(
  region: string,
  availableAgents: (typeof zyprusAgent.$inferSelect)[]
): Promise<typeof zyprusAgent.$inferSelect | null> {
  if (availableAgents.length === 0) {
    return null;
  }
  if (availableAgents.length === 1) {
    return availableAgents[0];
  }

  // Get current rotation state for this region
  const rotationState = await db
    .select()
    .from(leadForwardingRotation)
    .where(eq(leadForwardingRotation.region, region.toLowerCase()))
    .limit(1);

  // Sort agents by ID for consistent ordering across calls
  const sortedAgents = [...availableAgents].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  if (rotationState.length === 0 || !rotationState[0].lastForwardedToAgentId) {
    // First lead for this region - start with first agent
    console.log(
      `First lead for region ${region}, starting with ${sortedAgents[0].fullName}`
    );
    return sortedAgents[0];
  }

  const lastAgentId = rotationState[0].lastForwardedToAgentId;
  const lastIndex = sortedAgents.findIndex((a) => a.id === lastAgentId);

  if (lastIndex === -1) {
    // Last agent no longer available - start fresh
    console.log(
      `Previous agent no longer available for ${region}, restarting rotation`
    );
    return sortedAgents[0];
  }

  // Round-robin: next agent in sequence
  const nextIndex = (lastIndex + 1) % sortedAgents.length;
  const nextAgent = sortedAgents[nextIndex];

  console.log(
    `Rotation for ${region}: last was ${sortedAgents[lastIndex].fullName}, next is ${nextAgent.fullName}`
  );

  return nextAgent;
}

/**
 * Update the rotation state after successfully forwarding a lead
 */
async function updateRotationState(
  region: string,
  agentId: string
): Promise<void> {
  const now = new Date();

  try {
    await db
      .insert(leadForwardingRotation)
      .values({
        region: region.toLowerCase(),
        lastForwardedToAgentId: agentId,
        forwardCount: 1,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: leadForwardingRotation.region,
        set: {
          lastForwardedToAgentId: agentId,
          forwardCount: sql`${leadForwardingRotation.forwardCount} + 1`,
          updatedAt: now,
        },
      });

    console.log(`Updated rotation state for ${region}: agent ${agentId}`);
  } catch (error) {
    console.error(`Failed to update rotation state for ${region}:`, error);
    // Don't throw - rotation state update is non-critical
  }
}

/**
 * Log a lead in the database
 */
async function logLead(data: {
  propertyReferenceId: string | null;
  sourceGroupId: number;
  sourceGroupName: string | null;
  originalMessageId: string;
  originalMessageText: string | null;
  senderTelegramId: number | null;
  senderName: string | null;
  forwardedToAgentId: string | null;
  forwardedToTelegramId: string | null;
  region: string | null;
}): Promise<void> {
  try {
    await db.insert(telegramLead).values({
      propertyReferenceId: data.propertyReferenceId,
      sourceGroupId: data.sourceGroupId,
      sourceGroupName: data.sourceGroupName,
      originalMessageId: data.originalMessageId,
      originalMessageText: data.originalMessageText,
      senderTelegramId: data.senderTelegramId,
      senderName: data.senderName,
      forwardedToAgentId: data.forwardedToAgentId,
      forwardedToTelegramId: data.forwardedToTelegramId
        ? Number(data.forwardedToTelegramId)
        : null,
      propertyRegion: data.region,
      status: "forwarded",
    });
  } catch (error) {
    console.error("Error logging lead:", error);
  }
}

/**
 * Handle messages from Telegram groups
 * Main entry point for lead management
 */
export async function handleGroupMessage(
  message: TelegramMessage
): Promise<void> {
  const telegramClient = getTelegramClient();
  const chatId = message.chat.id;
  const messageText = message.text || message.caption || "";

  // Get or create group record
  const group = await getOrCreateGroup(
    chatId,
    message.chat.title,
    message.chat.type
  );

  // Extract property IDs from message
  const propertyIds = extractPropertyIds(messageText);

  // If no property IDs found, we don't process as a lead
  if (propertyIds.length === 0) {
    // Check if message mentions "lead", "client", "enquiry", etc.
    const isLeadMention = LEAD_MENTION_PATTERN.test(messageText);

    if (!isLeadMention) {
      // Not a lead message, ignore silently
      return;
    }
  }

  const region = group?.region || detectRegionFromName(message.chat.title);
  const primaryPropertyId = propertyIds[0] || null;

  // Get target agents for this region
  const targetAgents = await getTargetAgents(region, primaryPropertyId);

  if (targetAgents.length === 0) {
    console.log("No target agents found for region:", region);
    // Acknowledge in group but note no agents available
    try {
      await telegramClient.sendMessage({
        chatId,
        text: `Lead noted. No agents currently assigned for ${region || "this region"}.`,
        replyToMessageId: message.message_id,
      });
    } catch (error) {
      console.error("Failed to send acknowledgment:", error);
    }
    return;
  }

  // Filter to agents with Telegram IDs
  const agentsWithTelegram = targetAgents.filter((a) => a.telegramUserId);

  if (agentsWithTelegram.length === 0) {
    console.log("No agents with Telegram IDs for region:", region);
    try {
      await telegramClient.sendMessage({
        chatId,
        text: `Lead noted. Agents for ${region || "this region"} are not connected to Telegram.`,
        replyToMessageId: message.message_id,
      });
    } catch (error) {
      console.error("Failed to send acknowledgment:", error);
    }
    return;
  }

  // Select next agent using fair rotation
  const effectiveRegion = region || "all";
  const nextAgent = await getNextAgentInRotation(
    effectiveRegion,
    agentsWithTelegram
  );

  let forwardedAgentId: string | null = null;
  let forwardedTelegramId: string | null = null;
  let forwardedAgentName: string | null = null;

  if (nextAgent?.telegramUserId) {
    try {
      // Forward the original message
      await telegramClient.forwardMessage({
        chatId: nextAgent.telegramUserId,
        fromChatId: chatId,
        messageId: message.message_id,
      });

      // Send context message with property and sender info
      await telegramClient.sendMessage({
        chatId: nextAgent.telegramUserId,
        text: `New lead from ${message.chat.title || "Zyprus Group"}${
          primaryPropertyId ? `\nProperty: ${primaryPropertyId}` : ""
        }\nFrom: ${message.from?.first_name || "Unknown"} ${
          message.from?.last_name || ""
        }\nRegion: ${effectiveRegion}`,
      });

      forwardedAgentId = nextAgent.id;
      forwardedTelegramId = nextAgent.telegramUserId;
      forwardedAgentName = nextAgent.fullName;

      // Update rotation state for fair distribution
      await updateRotationState(effectiveRegion, nextAgent.id);

      console.log(
        `Lead forwarded to ${nextAgent.fullName} (rotation for ${effectiveRegion})`
      );
    } catch (error) {
      console.error(`Failed to forward to agent ${nextAgent.fullName}:`, error);
    }
  }

  // Log the lead
  await logLead({
    propertyReferenceId: primaryPropertyId,
    sourceGroupId: chatId,
    sourceGroupName: message.chat.title || null,
    originalMessageId: message.message_id.toString(),
    originalMessageText: messageText.substring(0, 2000),
    senderTelegramId: message.from?.id || null,
    senderName: message.from
      ? `${message.from.first_name} ${message.from.last_name || ""}`.trim()
      : null,
    forwardedToAgentId: forwardedAgentId,
    forwardedToTelegramId: forwardedTelegramId,
    region,
  });

  // Acknowledge in group
  if (forwardedAgentName) {
    try {
      await telegramClient.sendMessage({
        chatId,
        text: `Lead forwarded to ${forwardedAgentName}`,
        replyToMessageId: message.message_id,
      });
    } catch (error) {
      console.error("Failed to send acknowledgment:", error);
    }
  }
}
