import "server-only";
import { db } from "../db/client";
import { telegramGroup, telegramLead, zyprusAgent } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getTelegramClient } from "./client";
import type { TelegramMessage } from "./types";

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
  let match;
  while ((match = urlPattern.exec(text)) !== null) {
    ids.push(match[1]);
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
        groupType: groupType,
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
  if (!name) return "others";

  const nameLower = name.toLowerCase();

  if (nameLower.includes("alla") || nameLower.includes("all")) return "all";
  if (nameLower.includes("limassol")) return "limassol";
  if (nameLower.includes("paphos") || nameLower.includes("pafos"))
    return "paphos";
  if (nameLower.includes("larnaca") || nameLower.includes("larnaka"))
    return "larnaca";
  if (nameLower.includes("nicosia") || nameLower.includes("lefkosia"))
    return "nicosia";
  if (nameLower.includes("famagusta") || nameLower.includes("ammochostos"))
    return "famagusta";

  return "others";
}

/**
 * Detect region from group name
 */
function detectRegionFromName(name: string | undefined): string | null {
  if (!name) return null;

  const nameLower = name.toLowerCase();

  if (nameLower.includes("limassol")) return "Limassol";
  if (nameLower.includes("paphos") || nameLower.includes("pafos"))
    return "Paphos";
  if (nameLower.includes("larnaca") || nameLower.includes("larnaka"))
    return "Larnaca";
  if (nameLower.includes("nicosia") || nameLower.includes("lefkosia"))
    return "Nicosia";
  if (nameLower.includes("famagusta") || nameLower.includes("ammochostos"))
    return "Famagusta";
  if (nameLower.includes("alla") || nameLower.includes("all")) return "All";

  return null;
}

/**
 * Get the target agent(s) for lead forwarding based on region
 */
async function getTargetAgents(
  region: string | null,
  _propertyId?: string | null
): Promise<Array<typeof zyprusAgent.$inferSelect>> {
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
          and(eq(zyprusAgent.isActive, true), eq(zyprusAgent.canReceiveLeads, true))
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
      forwardedToTelegramId: data.forwardedToTelegramId ? Number(data.forwardedToTelegramId) : null,
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
    const isLeadMention = /\b(lead|client|enquiry|inquiry|interested|viewing|buyer|purchaser)\b/i.test(
      messageText
    );

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

  // Forward the message to target agent(s)
  let forwardedTo: string[] = [];
  let forwardedAgentId: string | null = null;
  let forwardedTelegramId: string | null = null;

  for (const agent of targetAgents) {
    if (!agent.telegramUserId) {
      console.log(
        `Agent ${agent.fullName} has no Telegram ID, skipping forward`
      );
      continue;
    }

    try {
      // Forward the original message
      await telegramClient.forwardMessage({
        chatId: agent.telegramUserId,
        fromChatId: chatId,
        messageId: message.message_id,
      });

      // Send context message
      await telegramClient.sendMessage({
        chatId: agent.telegramUserId,
        text: `New lead from ${message.chat.title || "Zyprus Group"}${
          primaryPropertyId ? `\nProperty: ${primaryPropertyId}` : ""
        }\nFrom: ${message.from?.first_name || "Unknown"} ${
          message.from?.last_name || ""
        }`,
      });

      forwardedTo.push(agent.fullName);
      forwardedAgentId = agent.id;
      forwardedTelegramId = agent.telegramUserId;

      // For now, only forward to first available agent to avoid spam
      // TODO: Implement rotation logic
      break;
    } catch (error) {
      console.error(`Failed to forward to agent ${agent.fullName}:`, error);
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
  if (forwardedTo.length > 0) {
    try {
      await telegramClient.sendMessage({
        chatId,
        text: `Lead forwarded to ${forwardedTo.join(", ")}`,
        replyToMessageId: message.message_id,
      });
    } catch (error) {
      console.error("Failed to send acknowledgment:", error);
    }
  }
}
