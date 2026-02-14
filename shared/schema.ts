import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth Models
import { users } from "./models/auth.js";
export * from "./models/auth.js";

// === COMPANIES ===
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(), // e.g., "acme.com"
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Extend users table with app-specific fields
// Note: We can't easily extend the actual table definition from the import without migration issues
// So we'll assume the auth table exists and add app-specific relations/logic in code or separate table if needed.
// For MVP, we'll store app-specific profile data in a separate 'profiles' table linked to auth users
// or just rely on the fact that we can join if we modify the auth table. 
// However, the auth blueprint says "don't drop it". 
// To avoid conflicts, I'll create a `profiles` table that 1:1 maps to `users`.

export const ACCOUNT_STATUSES = ["pending", "verified_limited", "verified_full", "restricted"] as const;

export const VERIFICATION_STEPS = ["oauth_completed", "url_submitted", "extraction_pending", "completed"] as const;

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // FK to users.id
  hashedLinkedinId: text("hashed_linkedin_id").unique(), // For 1-account-per-person enforcement
  companyId: integer("company_id").references(() => companies.id),
  role: text("role"), // User self-declared or extracted
  extractedRole: text("extracted_role"), // Role from LinkedIn scraper
  extractedCompany: text("extracted_company"), // Company from LinkedIn scraper
  linkedinUrlEncrypted: text("linkedin_url_encrypted"), // Encrypted string
  accountStatus: text("account_status", { enum: ACCOUNT_STATUSES }).default("pending"),
  verificationStep: text("verification_step", { enum: VERIFICATION_STEPS }).default("oauth_completed"),
  statusReason: text("status_reason"), // Reason if restricted
  isLinkedInVisible: boolean("is_linkedin_visible").default(false), // Consent to exchange
  lastVerifiedAt: timestamp("last_verified_at").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
  isExitMode: boolean("is_exit_mode").default(false),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
});

// === POSTS ===
export const POST_CATEGORIES = [
  "Mental Stress / Burnout",
  "Toxic Work Culture",
  "Need Referral / Job Help",
  "Policy / Work Discussion",
  "General Experience",
] as const;

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  authorId: text("author_id").notNull(), // FK to users.id (kept private in API)
  content: text("content").notNull(),
  category: text("category", { enum: POST_CATEGORIES }).notNull(),
  attachments: jsonb("attachments").default([]), // Array of { type, url, name }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("posts_company_id_idx").on(table.companyId),
  index("posts_category_idx").on(table.category)
]);

// === COMMENTS ===
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  parentId: integer("parent_id"), // Self-reference for nested comments
  authorId: text("author_id").notNull(), // FK to users.id
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("comments_post_id_idx").on(table.postId)
]);

// === REACTIONS ===
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  targetType: text("target_type", { enum: ["post", "comment"] }).notNull(),
  targetId: integer("target_id").notNull(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["support", "helpful"] }).notNull(),
}, (table) => [
  uniqueIndex("reaction_user_target_idx").on(table.userId, table.targetType, table.targetId)
]);

// === REPORTS ===
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  targetType: text("target_type", { enum: ["post", "comment"] }).notNull(),
  targetId: integer("target_id").notNull(),
  reporterId: text("reporter_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "resolved", "dismissed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const profilesRelations = relations(profiles, ({ one }) => ({
  company: one(companies, {
    fields: [profiles.companyId],
    references: [companies.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  company: one(companies, {
    fields: [posts.companyId],
    references: [companies.id],
  }),
  comments: many(comments),
  reactions: many(reactions), // technically polymorphic, handled in queries often
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "parent_child",
  }),
  replies: many(comments, {
    relationName: "parent_child",
  }),
  reactions: many(reactions),
}));

// === ZOD SCHEMAS ===
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, accountStatus: true, statusReason: true, isLinkedInVisible: true, isExitMode: true, isDeleted: true, deletedAt: true, joinedAt: true });
export const updateRoleSchema = z.object({ role: z.string().min(2).max(50) });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, authorId: true, companyId: true, createdAt: true, updatedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, authorId: true, postId: true, createdAt: true });

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, reporterId: true, status: true, createdAt: true });

// === TYPES ===
export type Company = typeof companies.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type Report = typeof reports.$inferSelect;

export type CreatePostInput = z.infer<typeof insertPostSchema>;
export type CreateCommentInput = z.infer<typeof insertCommentSchema>;

// === WEEKLY CHECK-INS ===
export const weeklyCheckins = pgTable("weekly_checkins", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Kept for rate limiting (1/week), never joined for reading
  companyId: integer("company_id").notNull().references(() => companies.id),
  moodScore: integer("mood_score").notNull(), // 1-5 or similar
  content: text("content"), // Optional text feedback
  categories: text("categories").array(), // e.g., ["Workload", "Management"]
  weekStartDate: timestamp("week_start_date").notNull(), // To easily identify the week
  createdAt: timestamp("created_at").defaultNow(),
});

// === CHAT REQUESTS (formerly LinkedIn Exchanges) ===
export const chatRequests = pgTable("chat_requests", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull(), // User who requested
  recipientId: text("recipient_id").notNull(), // User who was asked
  introMessage: text("intro_message").notNull(), // Anonymous intro message
  status: text("status", { enum: ["pending", "accepted", "rejected", "expired", "ignored"] }).default("pending"),
  senderIdentityRevealed: boolean("sender_identity_revealed").default(false), // Has sender agreed to reveal?
  receiverIdentityRevealed: boolean("receiver_identity_revealed").default(false), // Has receiver agreed to reveal?
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("chat_requests_recipient_id_idx").on(table.recipientId),
  index("chat_requests_requester_id_idx").on(table.requesterId)
]);

// Keep backward compatibility alias
export const linkedinExchanges = chatRequests;

// === PRIVATE MESSAGES ===
export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  chatRequestId: integer("chat_request_id").notNull().references(() => chatRequests.id),
  senderId: text("sender_id").notNull(), // FK to users.id
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("messages_chat_request_id_idx").on(table.chatRequestId)
]);

// === USER BLOCKS ===
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: text("blocker_id").notNull(), // User who blocked
  blockedId: text("blocked_id").notNull(), // User who was blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// === NEW ZOD SCHEMAS ===
export const insertWeeklyCheckinSchema = createInsertSchema(weeklyCheckins).omit({ id: true, createdAt: true, userId: true, companyId: true, weekStartDate: true });
export const insertChatRequestSchema = createInsertSchema(chatRequests).omit({ id: true, createdAt: true, updatedAt: true, senderIdentityRevealed: true, receiverIdentityRevealed: true });
export const insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({ id: true, createdAt: true });
export const insertBlockSchema = createInsertSchema(blocks).omit({ id: true, createdAt: true });

// Keep backward compatibility
export const insertLinkedinExchangeSchema = insertChatRequestSchema;

// === NEW TYPES ===
export type WeeklyCheckin = typeof weeklyCheckins.$inferSelect;
export type ChatRequest = typeof chatRequests.$inferSelect;
export type PrivateMessage = typeof privateMessages.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type CreateWeeklyCheckinInput = z.infer<typeof insertWeeklyCheckinSchema>;
export type CreateChatRequestInput = z.infer<typeof insertChatRequestSchema>;
export type CreatePrivateMessageInput = z.infer<typeof insertPrivateMessageSchema>;

// Keep backward compatibility
export type LinkedinExchange = ChatRequest;
