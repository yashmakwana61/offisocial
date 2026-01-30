import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth Models
import { users } from "./models/auth";
export * from "./models/auth";

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

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // FK to users.id
  companyId: integer("company_id").references(() => companies.id),
  role: text("role"), // "Product Designer", "Engineer" - self declared
  isVerified: boolean("is_verified").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === COMMENTS ===
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  authorId: text("author_id").notNull(), // FK to users.id
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === REACTIONS ===
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  targetType: text("target_type", { enum: ["post", "comment"] }).notNull(),
  targetId: integer("target_id").notNull(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["support", "helpful"] }).notNull(),
});

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
  reactions: many(reactions),
}));

// === ZOD SCHEMAS ===
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, isVerified: true, joinedAt: true });
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
