import type { InferSelectModel } from "drizzle-orm";
import {
  bigint,
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
    listingTypeId: uuid("listingTypeId"), // UUID from zyprus.com taxonomy_term--listing_type (For Sale, For Rent)
    propertyStatusId: uuid("propertyStatusId"), // UUID from zyprus.com taxonomy_term--property_status (Resale, New Build)
    viewIds: uuid("viewIds").array(), // UUIDs from zyprus.com taxonomy_term--property_views (Sea View, Mountain View)
    yearBuilt: integer("yearBuilt"), // Year the property was built
    referenceId: text("referenceId"), // Internal reference number
    energyClass: varchar("energyClass", { length: 5 }), // Energy efficiency rating (A+, A, B, C, etc.)
    videoUrl: text("videoUrl"), // Property video URL (YouTube, Vimeo)
    phoneNumber: varchar("phoneNumber", { length: 20 }), // Contact phone number
    propertyNotes: text("propertyNotes"), // Internal notes
    duplicateDetected: boolean("duplicateDetected").default(false), // Flag for potential duplicate
    coordinates: jsonb("coordinates").$type<{
      latitude: number;
      longitude: number;
    }>(), // GPS coordinates
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

// Land Listing Table (for plot/land listings on zyprus.com)
export const landListing = pgTable(
  "LandListing",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    chatId: uuid("chatId").references(() => chat.id),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: numeric("price").notNull(),
    currency: varchar("currency", { length: 3 }).default("EUR").notNull(),

    // Land-specific fields
    landSize: numeric("landSize").notNull(), // sqm
    landTypeId: uuid("landTypeId").notNull(), // UUID from zyprus.com taxonomy_term--land_type
    locationId: uuid("locationId"), // UUID from zyprus.com node--location
    listingTypeId: uuid("listingTypeId").notNull(), // UUID from zyprus.com taxonomy_term--listing_type
    priceModifierId: uuid("priceModifierId"), // UUID from zyprus.com taxonomy_term--price_modifier
    titleDeedId: uuid("titleDeedId"), // UUID from zyprus.com taxonomy_term--title_deed

    // Building permissions
    buildingDensity: numeric("buildingDensity"), // % density allowed
    siteCoverage: numeric("siteCoverage"), // % site coverage allowed
    maxFloors: integer("maxFloors"), // Max floors allowed
    maxHeight: numeric("maxHeight"), // Max building height in meters

    // Features
    infrastructureIds: uuid("infrastructureIds").array(), // UUIDs from zyprus.com taxonomy_term--infrastructure_
    viewIds: uuid("viewIds").array(), // UUIDs from zyprus.com taxonomy_term--property_views

    // Location
    coordinates: jsonb("coordinates").$type<{
      latitude: number;
      longitude: number;
    }>(),

    // Media
    image: jsonb("image").$type<string[]>(),

    // Optional
    referenceId: text("referenceId"),
    phoneNumber: varchar("phoneNumber", { length: 20 }),
    notes: text("notes"),
    duplicateDetected: boolean("duplicateDetected").default(false),

    // Status
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    zyprusListingId: text("zyprusListingId"),
    zyprusListingUrl: text("zyprusListingUrl"),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    publishedAt: timestamp("publishedAt"),
    deletedAt: timestamp("deletedAt"),
    draftExpiresAt: timestamp("draftExpiresAt"),
  },
  (table) => ({
    userIdx: index("LandListing_userId_idx").on(table.userId),
    statusIdx: index("LandListing_status_idx").on(table.status),
    createdAtIdx: index("LandListing_createdAt_idx").on(table.createdAt),
    deletedAtIdx: index("LandListing_deletedAt_idx").on(table.deletedAt),
    chatIdIdx: index("LandListing_chatId_idx").on(table.chatId),
    locationIdx: index("LandListing_locationId_idx").on(table.locationId),
    landTypeIdx: index("LandListing_landTypeId_idx").on(table.landTypeId),
    userIdStatusIdx: index("LandListing_userId_status_idx").on(
      table.userId,
      table.status
    ),
    userIdCreatedAtIdx: index("LandListing_userId_createdAt_idx").on(
      table.userId,
      table.createdAt.desc()
    ),
    draftExpiresAtIdx: index("LandListing_draftExpiresAt_idx").on(
      table.draftExpiresAt
    ),
  })
);

export type LandListing = InferSelectModel<typeof landListing>;

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
    agentTypeTimestampIdx: index(
      "AgentExecutionLog_agentType_timestamp_idx"
    ).on(table.agentType, table.timestamp.desc()),
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

// ===================================================================
// ZYPRUS AGENT REGISTRY TABLES
// ===================================================================

// Zyprus employee registry (real estate agents working with SOFIA)
export const zyprusAgent = pgTable(
  "ZyprusAgent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => user.id), // Optional - set after agent registers
    fullName: text("fullName").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phoneNumber: varchar("phoneNumber", { length: 20 }), // Cyprus mobile: +357 XX XXX XXX
    region: varchar("region", { length: 50 }).notNull(), // Limassol, Paphos, Larnaca, Famagusta, Nicosia, All
    role: varchar("role", { length: 50 }).notNull(), // CEO, Manager Limassol, Manager Paphos, Normal Agent, Listing Admin
    isActive: boolean("isActive").notNull().default(true),
    telegramUserId: bigint("telegramUserId", { mode: "number" }), // For Telegram identification
    whatsappPhoneNumber: varchar("whatsappPhoneNumber", { length: 20 }), // For WhatsApp identification
    lastActiveAt: timestamp("lastActiveAt"),
    registeredAt: timestamp("registeredAt"), // When they completed registration
    inviteSentAt: timestamp("inviteSentAt"), // When invite email was sent
    inviteToken: varchar("inviteToken", { length: 64 }), // Invite verification token
    notes: text("notes"), // Admin notes
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("ZyprusAgent_email_idx").on(table.email),
    phoneNumberIdx: index("ZyprusAgent_phoneNumber_idx").on(table.phoneNumber),
    regionIdx: index("ZyprusAgent_region_idx").on(table.region),
    roleIdx: index("ZyprusAgent_role_idx").on(table.role),
    isActiveIdx: index("ZyprusAgent_isActive_idx").on(table.isActive),
    telegramIdx: index("ZyprusAgent_telegramUserId_idx").on(
      table.telegramUserId
    ),
    whatsappIdx: index("ZyprusAgent_whatsappPhoneNumber_idx").on(
      table.whatsappPhoneNumber
    ),
    userIdIdx: index("ZyprusAgent_userId_idx").on(table.userId),
    inviteTokenIdx: index("ZyprusAgent_inviteToken_idx").on(table.inviteToken),
    // Composite index for regional queries (region + isActive)
    regionActiveIdx: index("ZyprusAgent_region_isActive_idx").on(
      table.region,
      table.isActive
    ),
  })
);

export type ZyprusAgent = InferSelectModel<typeof zyprusAgent>;

// Agent chat session tracking (multi-platform)
export const agentChatSession = pgTable(
  "AgentChatSession",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agentId")
      .notNull()
      .references(() => zyprusAgent.id, { onDelete: "cascade" }),
    chatId: uuid("chatId").references(() => chat.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 20 }).notNull(), // 'web', 'telegram', 'whatsapp'
    platformUserId: text("platformUserId"), // Telegram user ID, WhatsApp phone, or web session ID
    startedAt: timestamp("startedAt").notNull().defaultNow(),
    endedAt: timestamp("endedAt"),
    messageCount: integer("messageCount").default(0),
    documentCount: integer("documentCount").default(0),
    calculatorCount: integer("calculatorCount").default(0),
    listingCount: integer("listingCount").default(0),
    totalTokensUsed: integer("totalTokensUsed").default(0),
    totalCostUsd: numeric("totalCostUsd", { precision: 10, scale: 6 }).default(
      "0"
    ),
    metadata: jsonb("metadata"), // session-specific data
  },
  (table) => ({
    agentIdIdx: index("AgentChatSession_agentId_idx").on(table.agentId),
    chatIdIdx: index("AgentChatSession_chatId_idx").on(table.chatId),
    platformIdx: index("AgentChatSession_platform_idx").on(table.platform),
    startedAtIdx: index("AgentChatSession_startedAt_idx").on(
      table.startedAt.desc()
    ),
    // Composite index for agent activity queries (agentId + startedAt DESC)
    agentIdStartedAtIdx: index("AgentChatSession_agentId_startedAt_idx").on(
      table.agentId,
      table.startedAt.desc()
    ),
    // Composite index for platform analytics (platform + startedAt DESC)
    platformStartedAtIdx: index("AgentChatSession_platform_startedAt_idx").on(
      table.platform,
      table.startedAt.desc()
    ),
  })
);

export type AgentChatSession = InferSelectModel<typeof agentChatSession>;

export type { InferInsertModel } from "drizzle-orm";
