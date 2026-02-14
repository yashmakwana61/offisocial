import {
  users, profiles, companies, posts, comments, reactions, reports, sessions, weeklyCheckins, linkedinExchanges, chatRequests, privateMessages, blocks,
  type User, type Profile, type Company, type Post, type Comment, type Reaction, type Report,
  type CreatePostInput, type CreateCommentInput, type CreateWeeklyCheckinInput,
  type WeeklyCheckin, type LinkedinExchange, type ChatRequest, type PrivateMessage, type Block,
  type UpsertUser
} from "../shared/schema.js";
import { db } from "./db.js";
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
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileByHashedId(hashedId: string): Promise<Profile | undefined>;
  getProfileWithDetails(userId: string): Promise<(Profile & {
    companyName: string;
    maskedEmail: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  }) | undefined>;
  createProfile(userId: string, role: string, companyName: string, hashedLinkedinId?: string, status?: Profile["accountStatus"]): Promise<Profile>;
  updateProfileVerification(userId: string, updates: Partial<Profile>): Promise<Profile>;
  updateRole(userId: string, role: string): Promise<Profile>;
  deleteAccount(userId: string): Promise<void>;
  clearUserSessions(userId: string): Promise<void>;

  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  findOrCreateCompany(name: string): Promise<Company>;

  // Posts
  getCompanyPosts(companyId: number, userId: string, category?: string, limit?: number, offset?: number, searchQuery?: string): Promise<(Post & { commentCount: number; reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null })[]>;
  getPublicPosts(category?: string, limit?: number, offset?: number, userId?: string, searchQuery?: string): Promise<(Omit<Post, 'companyId' | 'authorId'> & { commentCount: number; reactionCounts: { support: number; helpful: number }; authorRole: string | null; userReaction: 'support' | 'helpful' | null })[]>;
  getPost(id: number, userId: string): Promise<(Post & { reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null }) | undefined>;
  getPublicPost(id: number, userId?: string): Promise<(Omit<Post, 'companyId' | 'authorId'> & {
    comments: (Omit<Comment, 'authorId'> & { authorRole: string | null; reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null })[];
    reactionCounts: { support: number; helpful: number };
    authorRole: string | null;
    userReaction: 'support' | 'helpful' | null;
  }) | undefined>;
  createPost(userId: string, companyId: number, post: CreatePostInput & { attachments?: any[] }): Promise<Post>;

  // Comments
  getPostComments(postId: number, userId: string): Promise<(Comment & { reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null })[]>;
  createComment(userId: string, postId: number, comment: CreateCommentInput & { parentId?: number }): Promise<Comment>;

  // Reactions
  toggleReaction(userId: string, targetType: 'post' | 'comment', targetId: number, type: 'support' | 'helpful'): Promise<{ action: 'added' | 'removed' }>;

  // Weekly Check-ins
  createWeeklyCheckin(userId: string, companyId: number, input: CreateWeeklyCheckinInput, weekStartDate: Date): Promise<WeeklyCheckin>;
  getWeeklyCheckin(userId: string, weekStartDate: Date): Promise<WeeklyCheckin | undefined>;
  getAggregatedCheckins(companyId: number, weekStartDate: Date): Promise<{ averageMood: number; totalCheckins: number; categoryCounts: Record<string, number> }>;

  // Chat Requests (formerly LinkedIn Exchanges)
  createChatRequest(requesterId: string, recipientId: string, introMessage: string): Promise<ChatRequest>;
  getChatRequest(id: number): Promise<ChatRequest | undefined>;
  respondToChatRequest(id: number, status: 'accepted' | 'rejected' | 'ignored'): Promise<ChatRequest>;
  revealIdentity(chatRequestId: number, userId: string, agree: boolean): Promise<{ mutualReveal: boolean; chatRequest: ChatRequest }>;
  getChatRequests(userId: string): Promise<(ChatRequest & {
    otherUserRole?: string | null;
    otherUserId: string;
    otherUserProfile?: Profile & {
      companyName: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    }
  })[]>;

  // Backward compatibility
  createExchangeRequest(requesterId: string, recipientId: string): Promise<LinkedinExchange>;
  getExchangeRequest(id: number): Promise<LinkedinExchange | undefined>;
  respondToExchange(id: number, status: 'accepted' | 'rejected'): Promise<LinkedinExchange>;
  getExchangeRequests(userId: string): Promise<(LinkedinExchange & { otherUserRole: string | null; otherUserId: string })[]>;

  // Private Messages
  getPrivateMessages(chatRequestId: number, userId: string): Promise<{ id: number; senderId: string; content: string; createdAt: string; isMine: boolean }[]>;
  sendPrivateMessage(chatRequestId: number, senderId: string, content: string): Promise<{ id: number; senderId: string; content: string; createdAt: string; isMine: boolean }>;

  // User Blocking
  blockUser(blockerId: string, blockedId: string): Promise<Block>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUsers(blockerId: string): Promise<Block[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  // Reports
  createReport(userId: string, targetType: 'post' | 'comment', targetId: number, reason: string): Promise<Report>;
  searchCompanies(query: string): Promise<Company[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
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

  async getProfileWithDetails(userId: string): Promise<(Profile & {
    companyName: string;
    maskedEmail: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  }) | undefined> {
    const profile = await this.getProfile(userId);
    if (!profile) return undefined;

    const user = await this.getUser(userId);
    const company = profile.companyId ? await this.getCompany(profile.companyId) : null;

    return {
      ...profile,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null,
      profileImageUrl: user?.profileImageUrl || null,
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

  async findOrCreateCompany(name: string): Promise<Company> {
    const company = await this.getCompanyByName(name);
    if (!company) {
      const [newCompany] = await db.insert(companies).values({
        name: name,
        domain: name.toLowerCase().replace(/\s+/g, '') + '.com',
      }).returning();
      return newCompany;
    }
    return company;
  }

  async createProfile(userId: string, role: string, companyName: string, hashedLinkedinId?: string, status: Profile["accountStatus"] = "pending", linkedinUrl?: string): Promise<Profile> {
    const company = await this.findOrCreateCompany(companyName);

    const [profile] = await db.insert(profiles).values({
      userId,
      companyId: company.id,
      role,
      hashedLinkedinId,
      accountStatus: status,
      verificationStep: status === "verified_full" ? "completed" : "oauth_completed",
      linkedinUrlEncrypted: linkedinUrl,
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

  async createWeeklyCheckin(userId: string, companyId: number, input: CreateWeeklyCheckinInput, weekStartDate: Date): Promise<WeeklyCheckin> {
    const [checkin] = await db.insert(weeklyCheckins).values({
      ...input,
      userId,
      companyId,
      weekStartDate,
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

    const totalMood = checkins.reduce((sum: number, c: WeeklyCheckin) => sum + c.moodScore, 0);
    const categoryCounts: Record<string, number> = {};
    const moodCountsMap: Record<number, number> = {};

    checkins.forEach((c: WeeklyCheckin) => {
      if (c.categories) {
        c.categories.forEach((cat: string) => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }

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
    // Backward compatibility: use new method with default intro message
    return await this.createChatRequest(requesterId, recipientId, "I'd like to connect with you.");
  }

  async getExchangeRequest(id: number): Promise<LinkedinExchange | undefined> {
    return await this.getChatRequest(id);
  }

  async respondToExchange(id: number, status: 'accepted' | 'rejected'): Promise<LinkedinExchange> {
    return await this.respondToChatRequest(id, status);
  }

  async getExchangeRequests(userId: string): Promise<any[]> {
    return await this.getChatRequests(userId);
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

  async getCompanyPosts(companyId: number, userId: string, category?: string, limit = 20, offset = 0, searchQuery?: string): Promise<any[]> {
    const conditions = [eq(posts.companyId, companyId)];
    if (category) {
      conditions.push(eq(posts.category, category as any));
    }

    if (searchQuery) {
      const searchTerms = `%${searchQuery.toLowerCase()}%`;
      conditions.push(
        sql`(${posts.content} ILIKE ${searchTerms} OR ${posts.category} ILIKE ${searchTerms})`
      );
    }

    const postsList = await db.select({
      post: posts,
      authorRole: profiles.role,
      commentCount: sql<number>`(SELECT count(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
      supportCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'post' AND ${reactions.type} = 'support')`,
      helpfulCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'post' AND ${reactions.type} = 'helpful')`,
      userReaction: sql<string | null>`(SELECT ${reactions.type} FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'post' AND ${reactions.userId} = ${userId} LIMIT 1)`,
    })
      .from(posts)
      .leftJoin(profiles, eq(posts.authorId, profiles.userId))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return postsList.map((item: any) => ({
      ...item.post,
      authorRole: item.authorRole || "Verified Employee",
      commentCount: Number(item.commentCount),
      reactionCounts: {
        support: Number(item.supportCount),
        helpful: Number(item.helpfulCount)
      },
      userReaction: item.userReaction || null
    }));
  }

  async getPublicPosts(category?: string, limit = 20, offset = 0, userId?: string, searchQuery?: string): Promise<any[]> {
    const safeCategories = [
      "Mental Stress / Burnout",
      "Toxic Work Culture",
      "Need Referral / Job Help",
      "Policy / Work Discussion",
      "General Experience",
    ];

    const conditions = [];
    if (category) {
      conditions.push(eq(posts.category, category as any));
    } else {
      conditions.push(inArray(posts.category, safeCategories as any[]));
    }

    if (searchQuery) {
      const searchTerms = `%${searchQuery.toLowerCase()}%`;
      conditions.push(
        sql`(${posts.content} ILIKE ${searchTerms} OR ${posts.category} ILIKE ${searchTerms})`
      );
    }

    const postsList = await db.select({
      post: posts,
      authorRole: profiles.role,
      commentCount: sql<number>`(SELECT count(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
      supportCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'post' AND ${reactions.type} = 'support')`,
      helpfulCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'post' AND ${reactions.type} = 'helpful')`,
      userReaction: userId ? sql<string | null>`(SELECT ${reactions.type} FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'post' AND ${reactions.userId} = ${userId} LIMIT 1)` : sql<string | null>`NULL`,
    })
      .from(posts)
      .leftJoin(profiles, eq(posts.authorId, profiles.userId))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch all companies once for sanitization (keeping this for now, though it's still a bit heavy if there are many)
    const allCompanies = await db.select({ name: companies.name }).from(companies);

    return postsList.map((item: any) => {
      let sanitizedContent = item.post.content;
      allCompanies.forEach((c: { name: string }) => {
        const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        sanitizedContent = sanitizedContent.replace(regex, "[REDACTED]");
      });

      return {
        id: item.post.id,
        content: sanitizedContent,
        category: item.post.category,
        createdAt: item.post.createdAt,
        updatedAt: item.post.updatedAt,
        authorId: item.post.authorId,
        commentCount: Number(item.commentCount),
        reactionCounts: {
          support: Number(item.supportCount),
          helpful: Number(item.helpfulCount)
        },
        authorRole: item.authorRole || "Verified Employee",
        userReaction: item.userReaction || null
      };
    });
  }

  async getPost(id: number, userId: string): Promise<any | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return undefined;

    const reactionStats = await this.getReactionStats('post', post.id, userId);
    const [commentCount] = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, id));

    return {
      ...post,
      commentCount: Number(commentCount.count),
      reactionCounts: reactionStats.counts,
      userReaction: reactionStats.userReaction
    };
  }


  async getPublicPost(id: number, userId?: string): Promise<any | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return undefined;

    const safeCategories = [
      "Mental Stress / Burnout",
      "Toxic Work Culture",
      "Need Referral / Job Help",
      "Policy / Work Discussion",
      "General Experience",
    ];
    if (!safeCategories.includes(post.category)) return undefined;

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, post.authorId));
    const reactionStats = await this.getReactionStats('post', post.id, 'GUEST');

    const allCompanies = await db.select({ name: companies.name }).from(companies);

    // Sanitize
    let sanitizedContent = post.content;
    allCompanies.forEach((c: { name: string }) => {
      const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      sanitizedContent = sanitizedContent.replace(regex, "[REDACTED]");
    });

    // Get comments
    const commentsList = await db.select().from(comments)
      .where(eq(comments.postId, id))
      .orderBy(desc(comments.createdAt));

    const enrichedComments = await Promise.all(commentsList.map(async (comment: Comment) => {
      const [commentProfile] = await db.select().from(profiles).where(eq(profiles.userId, comment.authorId));
      const commentReactionStats = await this.getReactionStats('comment', comment.id, userId || 'GUEST');

      // Sanitize comment
      let sanitizedCommentContent = comment.content;
      allCompanies.forEach((c: { name: string }) => {
        const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        sanitizedCommentContent = sanitizedCommentContent.replace(regex, "[REDACTED]");
      });

      return {
        id: comment.id,
        content: sanitizedCommentContent,
        createdAt: comment.createdAt,
        authorRole: commentProfile?.role || "Verified Employee",
        reactionCounts: commentReactionStats.counts,
        userReaction: commentReactionStats.userReaction
      };
    }));

    return {
      id: post.id,
      content: sanitizedContent,
      category: post.category,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorRole: profile?.role || "Verified Employee",
      commentCount: enrichedComments.length,
      reactionCounts: reactionStats.counts,
      userReaction: reactionStats.userReaction,
      comments: enrichedComments
    };
  }

  async getPostComments(postId: number, userId: string): Promise<any[]> {
    const commentsList = await db.select().from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    const enrichedComments = await Promise.all(commentsList.map(async (comment: Comment) => {
      const reactionStats = await this.getReactionStats('comment', comment.id, userId);
      return {
        ...comment,
        reactionCounts: reactionStats.counts,
        userReaction: reactionStats.userReaction
      };
    }));

    return enrichedComments;
  }

  async createComment(userId: string, postId: number, comment: CreateCommentInput & { parentId?: number }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values({
      ...comment,
      authorId: userId,
      postId,
      parentId: comment.parentId || null,
    }).returning();
    return newComment;
  }

  async createPost(userId: string, companyId: number, post: CreatePostInput & { attachments?: any[] }): Promise<Post> {
    const [newPost] = await db.insert(posts).values({
      ...post,
      authorId: userId,
      companyId,
      attachments: post.attachments || [],
    }).returning();
    return newPost;
  }

  async toggleReaction(userId: string, targetType: 'post' | 'comment', targetId: number, type: 'support' | 'helpful'): Promise<{ action: 'added' | 'removed' }> {
    console.log(`[STORAGE] toggleReaction: user=${userId}, target=${targetType}:${targetId}, type=${type}`);

    // Check if target exists
    if (targetType === 'post') {
      const [post] = await db.select().from(posts).where(eq(posts.id, targetId));
      if (!post) {
        console.error(`[STORAGE] Reaction target not found: ${targetType}:${targetId}`);
        throw new Error("Post not found");
      }
    } else {
      const [comment] = await db.select().from(comments).where(eq(comments.id, targetId));
      if (!comment) {
        console.error(`[STORAGE] Reaction target not found: ${targetType}:${targetId}`);
        throw new Error("Comment not found");
      }
    }

    const [existing] = await db.select().from(reactions).where(and(
      eq(reactions.userId, userId),
      eq(reactions.targetType, targetType),
      eq(reactions.targetId, targetId)
    ));

    if (existing) {
      if (existing.type === type) {
        console.log(`[STORAGE] Removing existing ${type} reaction for ${userId} on ${targetType}:${targetId}`);
        // Toggle off
        await db.delete(reactions).where(eq(reactions.id, existing.id));
        return { action: 'removed' };
      } else {
        console.log(`[STORAGE] Changing reaction type from ${existing.type} to ${type} for ${userId} on ${targetType}:${targetId}`);
        // Change type
        await db.update(reactions).set({ type }).where(eq(reactions.id, existing.id));
        return { action: 'added' };
      }
    } else {
      console.log(`[STORAGE] Adding new ${type} reaction for ${userId} on ${targetType}:${targetId}`);
      // Add new
      await db.insert(reactions).values({
        userId,
        targetType,
        targetId,
        type
      }).onConflictDoUpdate({
        target: [reactions.userId, reactions.targetType, reactions.targetId],
        set: { type }
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
      support: allReactions.filter((r: Reaction) => r.type === 'support').length,
      helpful: allReactions.filter((r: Reaction) => r.type === 'helpful').length
    };

    const userReaction = allReactions.find((r: Reaction) => r.userId === userId)?.type as 'support' | 'helpful' | null || null;

    return { counts, userReaction };
  }

  // === CHAT REQUESTS (New Implementation) ===
  async createChatRequest(requesterId: string, recipientId: string, introMessage: string): Promise<ChatRequest> {
    // Check if pending exists
    const [existing] = await db.select().from(chatRequests).where(and(
      eq(chatRequests.requesterId, requesterId),
      eq(chatRequests.recipientId, recipientId),
      eq(chatRequests.status, 'pending')
    ));

    if (existing) return existing;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const [request] = await db.insert(chatRequests).values({
      requesterId,
      recipientId,
      introMessage,
      expiresAt,
    }).returning();
    return request;
  }

  async getChatRequest(id: number): Promise<ChatRequest | undefined> {
    const [request] = await db.select().from(chatRequests).where(eq(chatRequests.id, id));
    return request;
  }

  async respondToChatRequest(id: number, status: 'accepted' | 'rejected' | 'ignored'): Promise<ChatRequest> {
    const [updated] = await db.update(chatRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(chatRequests.id, id))
      .returning();
    return updated;
  }

  async revealIdentity(chatRequestId: number, userId: string, agree: boolean): Promise<{ mutualReveal: boolean; chatRequest: ChatRequest }> {
    const chatRequest = await this.getChatRequest(chatRequestId);
    if (!chatRequest) throw new Error('Chat request not found');

    const isRequester = chatRequest.requesterId === userId;
    const isRecipient = chatRequest.recipientId === userId;

    if (!isRequester && !isRecipient) {
      throw new Error('Not authorized to reveal identity for this chat request');
    }

    const updates: Partial<ChatRequest> = {};
    if (isRequester) {
      updates.senderIdentityRevealed = agree;
    } else {
      updates.receiverIdentityRevealed = agree;
    }

    const [updated] = await db.update(chatRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatRequests.id, chatRequestId))
      .returning();

    const mutualReveal = updated.senderIdentityRevealed && updated.receiverIdentityRevealed;

    return { mutualReveal, chatRequest: updated };
  }

  async getChatRequests(userId: string): Promise<(ChatRequest & {
    otherUserRole?: string | null;
    otherUserId: string;
    otherUserProfile?: Profile & {
      companyName: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    }
  })[]> {
    // Fetch requests where user is either requester or recipient
    const requests = await db.select().from(chatRequests).where(
      sql`${chatRequests.requesterId} = ${userId} OR ${chatRequests.recipientId} = ${userId}`
    ).orderBy(desc(chatRequests.createdAt));

    const enriched = await Promise.all(requests.map(async (req: ChatRequest) => {
      const isRequester = req.requesterId === userId;
      const otherUserId = isRequester ? req.recipientId : req.requesterId;
      const [otherProfile] = await db.select().from(profiles).where(eq(profiles.userId, otherUserId));

      // Only include full profile if mutual reveal has happened
      let otherUserProfile = undefined;
      if (req.senderIdentityRevealed && req.receiverIdentityRevealed) {
        const company = otherProfile?.companyId ? await this.getCompany(otherProfile.companyId) : null;
        const otherUser = await this.getUser(otherUserId);
        otherUserProfile = {
          ...otherProfile,
          firstName: otherUser?.firstName || null,
          lastName: otherUser?.lastName || null,
          profileImageUrl: otherUser?.profileImageUrl || null,
          companyName: company?.name || "Unknown Company",
        };
      }

      return {
        ...req,
        otherUserRole: otherProfile?.role || "Verified Employee",
        otherUserId,
        otherUserProfile
      };
    }));

    return enriched;
  }

  // === PRIVATE MESSAGES ===
  async getPrivateMessages(chatRequestId: number, userId: string): Promise<{ id: number; senderId: string; content: string; createdAt: string; isMine: boolean }[]> {
    const chatRequest = await this.getChatRequest(chatRequestId);
    if (!chatRequest) throw new Error('Chat request not found');

    // Verify user is part of this chat
    if (chatRequest.requesterId !== userId && chatRequest.recipientId !== userId) {
      throw new Error('Not authorized to view messages for this chat');
    }

    const messages = await db.select().from(privateMessages)
      .where(eq(privateMessages.chatRequestId, chatRequestId))
      .orderBy(privateMessages.createdAt);

    return messages.map((msg: PrivateMessage) => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
      isMine: msg.senderId === userId
    }));
  }

  async sendPrivateMessage(chatRequestId: number, senderId: string, content: string): Promise<{ id: number; senderId: string; content: string; createdAt: string; isMine: boolean }> {
    const chatRequest = await this.getChatRequest(chatRequestId);
    if (!chatRequest) throw new Error('Chat request not found');

    // Verify user is part of this chat
    if (chatRequest.requesterId !== senderId && chatRequest.recipientId !== senderId) {
      throw new Error('Not authorized to send messages in this chat');
    }

    // Verify chat is accepted
    if (chatRequest.status !== 'accepted') {
      throw new Error('Chat request must be accepted before sending messages');
    }

    const [message] = await db.insert(privateMessages).values({
      chatRequestId,
      senderId,
      content,
    }).returning();

    return {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt?.toISOString() || new Date().toISOString(),
      isMine: true
    };
  }

  // === USER BLOCKING ===
  async blockUser(blockerId: string, blockedId: string): Promise<Block> {
    // Check if already blocked
    const [existing] = await db.select().from(blocks).where(and(
      eq(blocks.blockerId, blockerId),
      eq(blocks.blockedId, blockedId)
    ));

    if (existing) return existing;

    const [block] = await db.insert(blocks).values({
      blockerId,
      blockedId,
    }).returning();

    return block;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db.delete(blocks).where(and(
      eq(blocks.blockerId, blockerId),
      eq(blocks.blockedId, blockedId)
    ));
  }

  async getBlockedUsers(blockerId: string): Promise<Block[]> {
    return await db.select().from(blocks).where(eq(blocks.blockerId, blockerId));
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [block] = await db.select().from(blocks).where(and(
      eq(blocks.blockerId, blockerId),
      eq(blocks.blockedId, blockedId)
    ));
    return !!block;
  }

  async searchCompanies(query: string): Promise<Company[]> {
    return await db.select().from(companies).where(like(sql`lower(${companies.name})`, `%${query.toLowerCase()}%`)).limit(10);
  }
}

export const storage = new DatabaseStorage();
