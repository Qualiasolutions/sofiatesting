import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable(
  "Chat",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    visibility: varchar("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("private"),
    lastContext: jsonb("lastContext").$type<AppUsage | null>(),
  },
  (table) => ({
    // Composite index for user chat list queries (userId + createdAt DESC)
    userIdCreatedAtIdx: index("Chat_userId_createdAt_idx").on(
      table.userId,
      table.createdAt.desc()
    ),
  })
);

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable(
  "Message_v2",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: varchar("role").notNull(),
    parts: json("parts").notNull(),
    attachments: json("attachments").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    // Composite index for message history queries (chatId + createdAt ASC)
    chatIdCreatedAtIdx: index("Message_v2_chatId_createdAt_idx").on(
      table.chatId,
      table.createdAt.asc()
    ),
  })
);

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }).onDelete("cascade"),
  })
);

export type Stream = InferSelectModel<typeof stream>;

// Property Listing Tables (Schema.org RealEstateListing compliant)
export const propertyListing = pgTable(
  "PropertyListing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    chatId: uuid("chatId").references(() => chat.id),
    name: text("name").notNull(),
    description: text("description").notNull(),
    address: jsonb("address").notNull(), // Schema.org PostalAddress
    price: numeric("price").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    numberOfRooms: integer("numberOfRooms").notNull(), // bedrooms
    numberOfBathroomsTotal: numeric("numberOfBathroomsTotal").notNull(),
    floorSize: numeric("floorSize").notNull(), // in m²
    propertyType: varchar("propertyType", { length: 50 }), // villa, apartment, etc. [DEPRECATED - use taxonomy fields below]
    propertyTypeId: uuid("propertyTypeId"), // UUID from zyprus.com taxonomy_term--property_type
    locationId: uuid("locationId"), // UUID from zyprus.com node--location
    indoorFeatureIds: uuid("indoorFeatureIds").array(), // UUIDs from zyprus.com taxonomy_term--indoor_property_features
    outdoorFeatureIds: uuid("outdoorFeatureIds").array(), // UUIDs from zyprus.com taxonomy_term--outdoor_property_features
    priceModifierId: uuid("priceModifierId"), // UUID from zyprus.com taxonomy_term--price_modifier
    titleDeedId: uuid("titleDeedId"), // UUID from zyprus.com taxonomy_term--title_deed
    amenityFeature: jsonb("amenityFeature"), // array of features [DEPRECATED - use featureIds above]
    image: jsonb("image"), // array of image URLs
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, queued, uploading, uploaded, failed, published
    zyprusListingId: text("zyprusListingId"), // ID from zyprus.com
    zyprusListingUrl: text("zyprusListingUrl"), // public URL
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    publishedAt: timestamp("publishedAt"),
    deletedAt: timestamp("deletedAt"), // soft delete
    draftExpiresAt: timestamp("draftExpiresAt"), // auto-cleanup drafts after 7 days
  },
  (table) => ({
    userIdx: index("PropertyListing_userId_idx").on(table.userId),
    statusIdx: index("PropertyListing_status_idx").on(table.status),
    createdAtIdx: index("PropertyListing_createdAt_idx").on(table.createdAt),
    deletedAtIdx: index("PropertyListing_deletedAt_idx").on(table.deletedAt),
    chatIdIdx: index("PropertyListing_chatId_idx").on(table.chatId),
    locationIdx: index("PropertyListing_locationId_idx").on(table.locationId),
    propertyTypeIdx: index("PropertyListing_propertyTypeId_idx").on(
      table.propertyTypeId
    ),
    // Composite index for user listings queries (userId + status)
    userIdStatusIdx: index("PropertyListing_userId_status_idx").on(
      table.userId,
      table.status
    ),
    // Composite index for user listings sorted by creation date (userId + createdAt DESC)
    userIdCreatedAtIdx: index("PropertyListing_userId_createdAt_idx").on(
      table.userId,
      table.createdAt.desc()
    ),
    // Index for draft cleanup cron job
    draftExpiresAtIdx: index("PropertyListing_draftExpiresAt_idx").on(
      table.draftExpiresAt
    ),
  })
);

export type PropertyListing = InferSelectModel<typeof propertyListing>;

export const listingUploadAttempt = pgTable(
  "ListingUploadAttempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listingId")
      .notNull()
      .references(() => propertyListing.id),
    attemptNumber: integer("attemptNumber").notNull(),
    status: varchar("status", { length: 20 }).notNull(), // success, failed, timeout, rate_limited
    errorMessage: text("errorMessage"),
    errorCode: text("errorCode"),
    apiResponse: jsonb("apiResponse"),
    attemptedAt: timestamp("attemptedAt").notNull().defaultNow(),
    completedAt: timestamp("completedAt"),
    durationMs: integer("durationMs"),
  },
  (table) => ({
    listingIdx: index("ListingUploadAttempt_listingId_idx").on(table.listingId),
    attemptedAtIdx: index("ListingUploadAttempt_attemptedAt_idx").on(
      table.attemptedAt
    ),
  })
);

export type ListingUploadAttempt = InferSelectModel<
  typeof listingUploadAttempt
>;

// ===================================================================
// ADMIN PANEL TABLES
// ===================================================================

// Admin user roles and permissions
export const adminUserRole = pgTable("AdminUserRole", {
  userId: uuid("userId")
    .primaryKey()
    .notNull()
    .references(() => user.id),
  role: varchar("role", { length: 20 }).notNull(), // 'superadmin', 'admin', 'support', 'analyst'
  permissions: jsonb("permissions"), // granular permissions
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  createdBy: uuid("createdBy").references(() => user.id),
});

export type AdminUserRole = InferSelectModel<typeof adminUserRole>;

// System health logs
export const systemHealthLog = pgTable(
  "SystemHealthLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    service: varchar("service", { length: 50 }).notNull(), // 'telegram', 'whatsapp', 'zyprus', 'ai_gateway', 'database', 'redis'
    status: varchar("status", { length: 20 }).notNull(), // 'healthy', 'degraded', 'down'
    responseTimeMs: integer("responseTimeMs"),
    errorRate: numeric("errorRate"), // percentage
    metrics: jsonb("metrics"), // service-specific metrics
    details: text("details"),
  },
  (table) => ({
    timestampIdx: index("SystemHealthLog_timestamp_idx").on(table.timestamp),
    serviceIdx: index("SystemHealthLog_service_idx").on(table.service),
    statusIdx: index("SystemHealthLog_status_idx").on(table.status),
    // Composite index for service health queries (service + timestamp DESC)
    serviceTimestampIdx: index("SystemHealthLog_service_timestamp_idx").on(
      table.service,
      table.timestamp.desc()
    ),
  })
);

export type SystemHealthLog = InferSelectModel<typeof systemHealthLog>;

// Agent execution logs (tracks AI agent interactions)
export const agentExecutionLog = pgTable(
  "AgentExecutionLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    agentType: varchar("agentType", { length: 50 }).notNull(), // 'chat', 'telegram', 'whatsapp', 'bmad'
    userId: uuid("userId").references(() => user.id),
    chatId: uuid("chatId").references(() => chat.id),
    action: varchar("action", { length: 100 }).notNull(), // 'document_generation', 'calculator_usage', 'property_listing', etc.
    durationMs: integer("durationMs"),
    tokensUsed: integer("tokensUsed"),
    modelUsed: varchar("modelUsed", { length: 50 }), // 'chat-model', 'chat-model-sonnet', etc.
    costUsd: numeric("costUsd", { precision: 10, scale: 6 }),
    success: boolean("success").notNull(),
    errorMessage: text("errorMessage"),
    metadata: jsonb("metadata"), // additional context
  },
  (table) => ({
    timestampIdx: index("AgentExecutionLog_timestamp_idx").on(table.timestamp),
    agentTypeIdx: index("AgentExecutionLog_agentType_idx").on(table.agentType),
    userIdIdx: index("AgentExecutionLog_userId_idx").on(table.userId),
    successIdx: index("AgentExecutionLog_success_idx").on(table.success),
    // Composite index for agent performance queries (agentType + timestamp DESC)
    agentTypeTimestampIdx: index("AgentExecutionLog_agentType_timestamp_idx").on(
      table.agentType,
      table.timestamp.desc()
    ),
  })
);

export type AgentExecutionLog = InferSelectModel<typeof agentExecutionLog>;

// Calculator usage tracking
export const calculatorUsageLog = pgTable(
  "CalculatorUsageLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    calculatorType: varchar("calculatorType", { length: 50 }).notNull(), // 'vat', 'transfer_fees', 'capital_gains'
    userId: uuid("userId").references(() => user.id),
    inputs: jsonb("inputs").notNull(), // calculator inputs
    outputs: jsonb("outputs").notNull(), // calculator results
    source: varchar("source", { length: 20 }).notNull(), // 'web', 'telegram', 'whatsapp'
  },
  (table) => ({
    timestampIdx: index("CalculatorUsageLog_timestamp_idx").on(table.timestamp),
    calculatorTypeIdx: index("CalculatorUsageLog_calculatorType_idx").on(
      table.calculatorType
    ),
    userIdIdx: index("CalculatorUsageLog_userId_idx").on(table.userId),
    sourceIdx: index("CalculatorUsageLog_source_idx").on(table.source),
  })
);

export type CalculatorUsageLog = InferSelectModel<typeof calculatorUsageLog>;

// WhatsApp conversations (for future WhatsApp integration)
export const whatsappConversation = pgTable(
  "WhatsAppConversation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
    userId: uuid("userId").references(() => user.id),
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'paused', 'ended'
    metadata: jsonb("metadata"), // conversation context
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    lastMessageAt: timestamp("lastMessageAt"),
  },
  (table) => ({
    phoneNumberIdx: index("WhatsAppConversation_phoneNumber_idx").on(
      table.phoneNumber
    ),
    userIdIdx: index("WhatsAppConversation_userId_idx").on(table.userId),
    statusIdx: index("WhatsAppConversation_status_idx").on(table.status),
    lastMessageAtIdx: index("WhatsAppConversation_lastMessageAt_idx").on(
      table.lastMessageAt
    ),
  })
);

export type WhatsAppConversation = InferSelectModel<
  typeof whatsappConversation
>;

// Integration status tracking
export const integrationStatus = pgTable("IntegrationStatus", {
  service: varchar("service", { length: 50 }).primaryKey(), // 'telegram', 'zyprus', 'ai_gateway', 'whatsapp'
  isEnabled: boolean("isEnabled").notNull().default(true),
  lastCheckAt: timestamp("lastCheckAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  consecutiveFailures: integer("consecutiveFailures").notNull().default(0),
  config: jsonb("config"), // service-specific configuration
  errorLog: text("errorLog"), // last error details
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type IntegrationStatus = InferSelectModel<typeof integrationStatus>;

// Admin audit logs (track admin actions)
export const adminAuditLog = pgTable(
  "AdminAuditLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: uuid("adminUserId")
      .notNull()
      .references(() => user.id),
    action: varchar("action", { length: 100 }).notNull(), // 'user_banned', 'config_changed', 'deployment_triggered', etc.
    targetType: varchar("targetType", { length: 50 }), // 'user', 'integration', 'system', etc.
    targetId: uuid("targetId"), // ID of affected resource
    changes: jsonb("changes"), // before/after values
    ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
    userAgent: text("userAgent"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => ({
    timestampIdx: index("AdminAuditLog_timestamp_idx").on(table.timestamp),
    adminUserIdIdx: index("AdminAuditLog_adminUserId_idx").on(
      table.adminUserId
    ),
    actionIdx: index("AdminAuditLog_action_idx").on(table.action),
    targetTypeIdx: index("AdminAuditLog_targetType_idx").on(table.targetType),
  })
);

export type AdminAuditLog = InferSelectModel<typeof adminAuditLog>;

// Document generation tracking (for analytics)
export const documentGenerationLog = pgTable(
  "DocumentGenerationLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    userId: uuid("userId").references(() => user.id),
    chatId: uuid("chatId").references(() => chat.id),
    templateType: varchar("templateType", { length: 50 }).notNull(), // 'registration', 'viewing', 'marketing', etc.
    templateName: varchar("templateName", { length: 100 }), // specific template
    source: varchar("source", { length: 20 }).notNull(), // 'web', 'telegram', 'whatsapp'
    success: boolean("success").notNull(),
    errorMessage: text("errorMessage"),
    durationMs: integer("durationMs"),
  },
  (table) => ({
    timestampIdx: index("DocumentGenerationLog_timestamp_idx").on(
      table.timestamp
    ),
    templateTypeIdx: index("DocumentGenerationLog_templateType_idx").on(
      table.templateType
    ),
    userIdIdx: index("DocumentGenerationLog_userId_idx").on(table.userId),
    sourceIdx: index("DocumentGenerationLog_source_idx").on(table.source),
  })
);

export type DocumentGenerationLog = InferSelectModel<
  typeof documentGenerationLog
>;

// User activity summary (daily aggregated stats)
export const userActivitySummary = pgTable(
  "UserActivitySummary",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    date: timestamp("date").notNull(), // date without time component
    messageCount: integer("messageCount").notNull().default(0),
    documentCount: integer("documentCount").notNull().default(0),
    calculatorCount: integer("calculatorCount").notNull().default(0),
    listingCount: integer("listingCount").notNull().default(0),
    totalTokensUsed: integer("totalTokensUsed").notNull().default(0),
    totalCostUsd: numeric("totalCostUsd", { precision: 10, scale: 6 })
      .notNull()
      .default("0"),
    channels: jsonb("channels"), // breakdown by channel (web, telegram, whatsapp)
  },
  (table) => ({
    userIdDateIdx: index("UserActivitySummary_userId_date_idx").on(
      table.userId,
      table.date.desc()
    ),
    dateIdx: index("UserActivitySummary_date_idx").on(table.date),
  })
);

export type UserActivitySummary = InferSelectModel<typeof userActivitySummary>;

export type { InferInsertModel } from "drizzle-orm";
