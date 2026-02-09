import {
  users, profiles, companies, posts, comments, reactions, reports, sessions, weeklyCheckins, linkedinExchanges,
  type User, type Profile, type Company, type Post, type Comment, type Reaction, type Report,
  type CreatePostInput, type CreateCommentInput, type CreateWeeklyCheckinInput,
  type WeeklyCheckin, type LinkedinExchange,
  type UpsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray, like } from "drizzle-orm";

function maskEmail(email: string | null): string {
  if (!email) return "***@***.***";
  const [local, domain] = email.split("@");
  if (!domain) return "***@***.***";
  const maskedLocal = local.slice(0, 2) + "***";
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0].slice(0, 2) + "***." + domainParts.slice(1).join(".");
  return maskedLocal + "@" + maskedDomain;
}

export interface IStorage {
  // Auth & Profile
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileByHashedId(hashedId: string): Promise<Profile | undefined>;
  getProfileWithDetails(userId: string): Promise<(Profile & { companyName: string; maskedEmail: string }) | undefined>;
  createProfile(userId: string, role: string, companyName: string, hashedLinkedinId?: string, status?: Profile["accountStatus"]): Promise<Profile>;
  updateProfileVerification(userId: string, updates: Partial<Profile>): Promise<Profile>;
  updateRole(userId: string, role: string): Promise<Profile>;
  deleteAccount(userId: string): Promise<void>;
  clearUserSessions(userId: string): Promise<void>;

  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByName(name: string): Promise<Company | undefined>;

  // Posts
  getCompanyPosts(companyId: number, userId: string, category?: string): Promise<(Post & { commentCount: number; reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null })[]>;
  getPost(id: number, userId: string): Promise<(Post & { reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null }) | undefined>;
  createPost(userId: string, companyId: number, post: CreatePostInput): Promise<Post>;

  // Comments
  getPostComments(postId: number, userId: string): Promise<(Comment & { reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null })[]>;
  createComment(userId: string, postId: number, comment: CreateCommentInput): Promise<Comment>;

  // Reactions
  toggleReaction(userId: string, targetType: 'post' | 'comment', targetId: number, type: 'support' | 'helpful'): Promise<{ action: 'added' | 'removed' }>;

  // Weekly Check-ins
  createWeeklyCheckin(userId: string, companyId: number, input: CreateWeeklyCheckinInput): Promise<WeeklyCheckin>;
  getWeeklyCheckin(userId: string, weekStartDate: Date): Promise<WeeklyCheckin | undefined>;
  getAggregatedCheckins(companyId: number, weekStartDate: Date): Promise<{ averageMood: number; totalCheckins: number; categoryCounts: Record<string, number> }>;

  // LinkedIn Exchanges
  createExchangeRequest(requesterId: string, recipientId: string): Promise<LinkedinExchange>;
  getExchangeRequest(id: number): Promise<LinkedinExchange | undefined>;
  respondToExchange(id: number, status: 'accepted' | 'rejected'): Promise<LinkedinExchange>;

  // Reports
  createReport(userId: string, targetType: 'post' | 'comment', targetId: number, reason: string): Promise<Report>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(
      and(eq(profiles.userId, userId), eq(profiles.isDeleted, false))
    );
    return profile;
  }

  async getProfileByHashedId(hashedId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(
      and(eq(profiles.hashedLinkedinId, hashedId), eq(profiles.isDeleted, false))
    );
    return profile;
  }

  async getProfileWithDetails(userId: string): Promise<(Profile & { companyName: string; maskedEmail: string }) | undefined> {
    const profile = await this.getProfile(userId);
    if (!profile) return undefined;

    const user = await this.getUser(userId);
    const company = profile.companyId ? await this.getCompany(profile.companyId) : null;

    return {
      ...profile,
      companyName: company?.name || "Unknown Company",
      maskedEmail: maskEmail(user?.email || null),
    };
  }

  async updateRole(userId: string, role: string): Promise<Profile> {
    const [updated] = await db.update(profiles)
      .set({ role })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  async deleteAccount(userId: string): Promise<void> {
    // Soft delete the profile (mark as deleted)
    await db.update(profiles).set({
      isDeleted: true,
      deletedAt: new Date(),
    }).where(eq(profiles.userId, userId));

    // Anonymize posts - keep them but remove author reference
    await db.update(posts).set({
      authorId: 'DELETED_USER',
    }).where(eq(posts.authorId, userId));

    // Anonymize comments
    await db.update(comments).set({
      authorId: 'DELETED_USER',
    }).where(eq(comments.authorId, userId));

    // Remove reactions by user
    await db.delete(reactions).where(eq(reactions.userId, userId));

    // Clear sessions
    await this.clearUserSessions(userId);
  }

  async clearUserSessions(userId: string): Promise<void> {
    // Delete all sessions where the user ID is in the session data
    // The sess column is jsonb and contains user.id
    await db.delete(sessions).where(
      sql`${sessions.sess}::jsonb->'passport'->'user'->>'id' = ${userId}`
    );
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(sql`lower(${companies.name}) = lower(${name})`);
    return company;
  }

  async createProfile(userId: string, role: string, companyName: string, hashedLinkedinId?: string, status: Profile["accountStatus"] = "pending"): Promise<Profile> {
    // Find or create company
    let company = await this.getCompanyByName(companyName);
    if (!company) {
      const [newCompany] = await db.insert(companies).values({
        name: companyName,
        domain: companyName.toLowerCase().replace(/\s+/g, '') + '.com', // Placeholder domain logic
      }).returning();
      company = newCompany;
    }

    const [profile] = await db.insert(profiles).values({
      userId,
      companyId: company.id,
      role,
      hashedLinkedinId,
      accountStatus: status,
      verificationStep: status === "verified_full" ? "completed" : "oauth_completed",
      joinedAt: new Date(),
    }).returning();
    return profile;
  }

  async updateProfileVerification(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const [updated] = await db.update(profiles)
      .set({
        ...updates,
        lastVerifiedAt: updates.accountStatus?.includes("verified") ? new Date() : undefined,
      })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  async createWeeklyCheckin(userId: string, companyId: number, input: CreateWeeklyCheckinInput): Promise<WeeklyCheckin> {
    const [checkin] = await db.insert(weeklyCheckins).values({
      ...input,
      userId,
      companyId,
    }).returning();
    return checkin;
  }

  async getWeeklyCheckin(userId: string, weekStartDate: Date): Promise<WeeklyCheckin | undefined> {
    const [checkin] = await db.select().from(weeklyCheckins).where(and(
      eq(weeklyCheckins.userId, userId),
      eq(weeklyCheckins.weekStartDate, weekStartDate)
    ));
    return checkin;
  }

  async getAggregatedCheckins(companyId: number, weekStartDate: Date): Promise<{ averageMood: number; totalCheckins: number; categoryCounts: Record<string, number>; moodCounts: { moodScore: number; count: number }[] }> {
    const checkins = await db.select().from(weeklyCheckins).where(and(
      eq(weeklyCheckins.companyId, companyId),
      eq(weeklyCheckins.weekStartDate, weekStartDate)
    ));

    if (checkins.length === 0) {
      return { averageMood: 0, totalCheckins: 0, categoryCounts: {}, moodCounts: [] };
    }

    const totalMood = checkins.reduce((sum, c) => sum + c.moodScore, 0);
    const categoryCounts: Record<string, number> = {};
    const moodCountsMap: Record<number, number> = {};

    checkins.forEach(c => {
      // Categories
      if (c.categories) {
        c.categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }

      // Mood Counts
      moodCountsMap[c.moodScore] = (moodCountsMap[c.moodScore] || 0) + 1;
    });

    const moodCounts = Object.entries(moodCountsMap).map(([score, count]) => ({
      moodScore: Number(score),
      count
    }));

    return {
      averageMood: totalMood / checkins.length,
      totalCheckins: checkins.length,
      categoryCounts,
      moodCounts
    };
  }

  async createExchangeRequest(requesterId: string, recipientId: string): Promise<LinkedinExchange> {
    // Check if pending exists
    const [existing] = await db.select().from(linkedinExchanges).where(and(
      eq(linkedinExchanges.requesterId, requesterId),
      eq(linkedinExchanges.recipientId, recipientId),
      eq(linkedinExchanges.status, 'pending')
    ));

    if (existing) return existing;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const [request] = await db.insert(linkedinExchanges).values({
      requesterId,
      recipientId,
      expiresAt,
    }).returning();
    return request;
  }

  async getExchangeRequest(id: number): Promise<LinkedinExchange | undefined> {
    const [request] = await db.select().from(linkedinExchanges).where(eq(linkedinExchanges.id, id));
    return request;
  }

  async respondToExchange(id: number, status: 'accepted' | 'rejected'): Promise<LinkedinExchange> {
    const [updated] = await db.update(linkedinExchanges)
      .set({ status })
      .where(eq(linkedinExchanges.id, id))
      .returning();
    return updated;
  }

  async createReport(userId: string, targetType: 'post' | 'comment', targetId: number, reason: string): Promise<Report> {
    const [report] = await db.insert(reports).values({
      targetType,
      targetId,
      reporterId: userId,
      reason
    }).returning();
    return report;
  }

  async getCompanyPosts(companyId: number, userId: string, category?: string): Promise<any[]> {
    const conditions = [eq(posts.companyId, companyId)];
    if (category) {
      conditions.push(eq(posts.category, category as any));
    }

    const postsList = await db.select().from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt));

    // Exit Mode prioritization logic could be added here
    // e.g., if user is in Exit Mode, boost posts with category "Policy / Work Discussion" or similar?
    // For now, we return standard feed. 

    // For each post, get counts and user reaction
    // N+1 query problem here but okay for MVP scale
    const enrichedPosts = await Promise.all(postsList.map(async (post) => {
      const [commentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.id));

      const reactionStats = await this.getReactionStats('post', post.id, userId);

      return {
        ...post,
        commentCount: Number(commentCount.count),
        reactionCounts: reactionStats.counts,
        userReaction: reactionStats.userReaction
      };
    }));

    return enrichedPosts;
  }

  async getPost(id: number, userId: string): Promise<any | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return undefined;

    const reactionStats = await this.getReactionStats('post', post.id, userId);

    return {
      ...post,
      reactionCounts: reactionStats.counts,
      userReaction: reactionStats.userReaction
    };
  }

  async createPost(userId: string, companyId: number, post: CreatePostInput): Promise<Post> {
    const [newPost] = await db.insert(posts).values({
      ...post,
      authorId: userId,
      companyId,
    }).returning();
    return newPost;
  }

  async getPostComments(postId: number, userId: string): Promise<any[]> {
    const commentsList = await db.select().from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    const enrichedComments = await Promise.all(commentsList.map(async (comment) => {
      const reactionStats = await this.getReactionStats('comment', comment.id, userId);
      return {
        ...comment,
        reactionCounts: reactionStats.counts,
        userReaction: reactionStats.userReaction
      };
    }));

    return enrichedComments;
  }

  async createComment(userId: string, postId: number, comment: CreateCommentInput): Promise<Comment> {
    const [newComment] = await db.insert(comments).values({
      ...comment,
      authorId: userId,
      postId,
    }).returning();
    return newComment;
  }

  async toggleReaction(userId: string, targetType: 'post' | 'comment', targetId: number, type: 'support' | 'helpful'): Promise<{ action: 'added' | 'removed' }> {
    const [existing] = await db.select().from(reactions).where(and(
      eq(reactions.userId, userId),
      eq(reactions.targetType, targetType),
      eq(reactions.targetId, targetId)
    ));

    if (existing) {
      if (existing.type === type) {
        // Toggle off
        await db.delete(reactions).where(eq(reactions.id, existing.id));
        return { action: 'removed' };
      } else {
        // Change type
        await db.update(reactions).set({ type }).where(eq(reactions.id, existing.id));
        return { action: 'added' };
      }
    } else {
      // Add new
      await db.insert(reactions).values({
        userId,
        targetType,
        targetId,
        type
      });
      return { action: 'added' };
    }
  }

  private async getReactionStats(targetType: 'post' | 'comment', targetId: number, userId: string) {
    const allReactions = await db.select().from(reactions).where(and(
      eq(reactions.targetType, targetType),
      eq(reactions.targetId, targetId)
    ));

    const counts = {
      support: allReactions.filter(r => r.type === 'support').length,
      helpful: allReactions.filter(r => r.type === 'helpful').length
    };

    const userReaction = allReactions.find(r => r.userId === userId)?.type as 'support' | 'helpful' | null || null;

    return { counts, userReaction };
  }
}

export const storage = new DatabaseStorage();
