import {
  users, profiles, companies, posts, comments, reactions, reports, sessions, weeklyCheckins, linkedinExchanges, chatRequests, privateMessages, blocks, salaries, interviews, pollVotes,
  type User, type Profile, type Company, type Post, type Comment, type Reaction, type Report,
  type CreatePostInput, type CreateCommentInput, type CreateWeeklyCheckinInput, type CreateSalaryInput, type CreateInterviewInput,
  type WeeklyCheckin, type LinkedinExchange, type ChatRequest, type PrivateMessage, type Block, type Salary, type Interview, type PollVote,
  type UpsertUser
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc, sql, inArray, like } from "drizzle-orm";
import { redis } from "./redis.js";

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
  getPublicPosts(category?: string, limit?: number, offset?: number, userId?: string, searchQuery?: string): Promise<(Omit<Post, 'companyId' | 'authorId'> & {
    commentCount: number; reactionCounts: { support: number; helpful: number };
    authorRole: string | null;
    userReaction: 'support' | 'helpful' | null;
    pollResults?: { options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null };
  })[]>;
  getPost(id: number, userId: string): Promise<(Post & {
    reactionCounts: { support: number; helpful: number };
    userReaction: 'support' | 'helpful' | null;
    pollResults?: { options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null };
  }) | undefined>;
  getPublicPost(id: number, userId?: string): Promise<(Omit<Post, 'companyId' | 'authorId'> & {
    comments: (Omit<Comment, 'authorId'> & { authorRole: string | null; reactionCounts: { support: number; helpful: number }; userReaction: 'support' | 'helpful' | null })[];
    reactionCounts: { support: number; helpful: number };
    authorRole: string | null;
    userReaction: 'support' | 'helpful' | null;
    pollResults?: { options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null };
  }) | undefined>;
  createPost(userId: string, companyId: number, post: CreatePostInput & { attachments?: any[], pollData?: any }): Promise<Post>;

  // Polls
  votePoll(userId: string, postId: number, optionIndex: number): Promise<void>;
  getPollResults(postId: number, userId?: string): Promise<{ options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null } | undefined>;

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

  // Salaries
  getSalaries(companyId?: number, role?: string): Promise<(Salary & { companyName: string })[]>;
  createSalary(userId: string, salary: CreateSalaryInput): Promise<Salary>;

  // Interviews
  getInterviews(companyId?: number, role?: string): Promise<(Interview & { companyName: string })[]>;
  createInterview(userId: string, interview: CreateInterviewInput): Promise<Interview>;

  // Admin & Settings
  updateProfileSettings(userId: string, settings: any): Promise<Profile>;
  setAdminStatus(userId: string, isAdmin: boolean): Promise<Profile>;
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
    if (company) return company;

    const [newCompany] = await db.insert(companies).values({
      name: name,
      domain: name.toLowerCase().replace(/\s+/g, '') + '.com',
    }).returning();
    if (redis) {
      await redis.del("companies:names");
    }
    return newCompany;
  }

  async getCompanyNamesWithCache(): Promise<{ name: string }[]> {
    const cacheKey = "companies:names";
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (err) {
        console.error("[STORAGE] Redis get company names error:", err);
      }
    }

    const allCompanies = await db.select({ name: companies.name }).from(companies);

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(allCompanies), "EX", 600); // 10 minute cache
      } catch (err) {
        console.error("[STORAGE] Redis set company names error:", err);
      }
    }
    return allCompanies;
  }

  async createProfile(userId: string, role: string, companyName: string, hashedLinkedinId?: string, status: Profile["accountStatus"] = "pending", linkedinUrl?: string, interests?: string[], persona?: any): Promise<Profile> {
    const company = await this.findOrCreateCompany(companyName);

    const [profile] = await db.insert(profiles).values({
      userId,
      companyId: company.id,
      role,
      hashedLinkedinId,
      accountStatus: status,
      verificationStep: status === "verified_full" ? "completed" : "oauth_completed",
      linkedinUrlEncrypted: linkedinUrl,
      interests: interests || [],
      persona: persona || null,
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

    const postIds = postsList.map(item => item.post.id);
    const votes = postIds.length > 0
      ? await db.select().from(pollVotes).where(inArray(pollVotes.postId, postIds))
      : [];

    // Fetch company names with cache for sanitization
    const allCompanies = await this.getCompanyNamesWithCache();

    return postsList.map((item: any) => {
      let sanitizedContent = item.post.content;
      allCompanies.forEach((c: { name: string }) => {
        const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        sanitizedContent = sanitizedContent.replace(regex, "[REDACTED]");
      });

      const postVotes = votes.filter(v => v.postId === item.post.id);
      const pollData = item.post.pollData as { question: string, options: string[] } | null;

      let pollResults = undefined;
      if (pollData) {
        pollResults = {
          options: pollData.options.map((option, index) => ({
            label: option,
            count: postVotes.filter(v => v.optionIndex === index).length,
          })),
          totalVotes: postVotes.length,
          userVoteIndex: userId ? postVotes.find(v => v.userId === userId)?.optionIndex ?? null : null,
        };
      }

      return {
        id: item.post.id,
        content: sanitizedContent,
        category: item.post.category,
        attachments: item.post.attachments || [],
        createdAt: item.post.createdAt,
        updatedAt: item.post.updatedAt,
        authorId: item.post.authorId,
        commentCount: Number(item.commentCount),
        reactionCounts: {
          support: Number(item.supportCount),
          helpful: Number(item.helpfulCount)
        },
        authorRole: item.authorRole || "Verified Employee",
        userReaction: item.userReaction || null,
        pollResults
      };
    });
  }

  async getPublicPosts(category?: string, limit = 20, offset = 0, userId?: string, searchQuery?: string): Promise<any[]> {
    const cacheKey = `posts:public:${category || 'all'}:${limit}:${offset}:${searchQuery || 'none'}:${userId || 'guest'}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[STORAGE] Cache hit for ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (err) {
        console.error("[STORAGE] Redis get error:", err);
      }
    }

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

    // Fetch company names with cache
    const allCompanies = await this.getCompanyNamesWithCache();
    const postIds = postsList.map(item => item.post.id);
    const votes = postIds.length > 0
      ? await db.select().from(pollVotes).where(inArray(pollVotes.postId, postIds))
      : [];

    const result = postsList.map((item: any) => {
      let sanitizedContent = item.post.content;
      allCompanies.forEach((c: { name: string }) => {
        const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        sanitizedContent = sanitizedContent.replace(regex, "[REDACTED]");
      });

      const postVotes = votes.filter(v => v.postId === item.post.id);
      const pollData = item.post.pollData as { question: string, options: string[] } | null;

      let pollResults = undefined;
      if (pollData) {
        pollResults = {
          options: pollData.options.map((option, index) => ({
            label: option,
            count: postVotes.filter(v => v.optionIndex === index).length,
          })),
          totalVotes: postVotes.length,
          userVoteIndex: userId ? postVotes.find(v => v.userId === userId)?.optionIndex ?? null : null,
        };
      }

      return {
        id: item.post.id,
        content: sanitizedContent,
        category: item.post.category,
        attachments: item.post.attachments || [],
        createdAt: item.post.createdAt,
        updatedAt: item.post.updatedAt,
        authorId: item.post.authorId,
        commentCount: Number(item.commentCount),
        reactionCounts: {
          support: Number(item.supportCount),
          helpful: Number(item.helpfulCount)
        },
        authorRole: item.authorRole || "Verified Employee",
        userReaction: item.userReaction || null,
        pollResults
      };
    });

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(result), "EX", 120); // 2 minute cache
        console.log(`[STORAGE] Cache set for ${cacheKey}`);
      } catch (err) {
        console.error("[STORAGE] Redis set error:", err);
      }
    }

    return result;
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
      userReaction: reactionStats.userReaction,
      pollResults: await this.getPollResults(id, userId)
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

    // Efficient count using batch stats or individual but single call
    const reactionStats = await this.getReactionStats('post', post.id, userId || 'GUEST');

    const allCompanies = await this.getCompanyNamesWithCache();

    // Sanitize post content
    let sanitizedContent = post.content;
    allCompanies.forEach((c: { name: string }) => {
      const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      sanitizedContent = sanitizedContent.replace(regex, "[REDACTED]");
    });

    // Get comments with roles and reactions in FEW queries
    const commentsList = await db.select({
      comment: comments,
      authorRole: profiles.role,
      supportCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'comment' AND ${reactions.type} = 'support')`,
      helpfulCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'comment' AND ${reactions.type} = 'helpful')`,
      userReaction: userId ? sql<string | null>`(SELECT ${reactions.type} FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'comment' AND ${reactions.userId} = ${userId} LIMIT 1)` : sql<string | null>`NULL`,
    })
      .from(comments)
      .leftJoin(profiles, eq(comments.authorId, profiles.userId))
      .where(eq(comments.postId, id))
      .orderBy(desc(comments.createdAt));

    const enrichedComments = commentsList.map((item: any) => {
      // Sanitize comment
      let sanitizedCommentContent = item.comment.content;
      allCompanies.forEach((c: { name: string }) => {
        const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        sanitizedCommentContent = sanitizedCommentContent.replace(regex, "[REDACTED]");
      });

      return {
        id: item.comment.id,
        content: sanitizedCommentContent,
        createdAt: item.comment.createdAt,
        authorRole: item.authorRole || "Verified Employee",
        reactionCounts: {
          support: Number(item.supportCount),
          helpful: Number(item.helpfulCount)
        },
        userReaction: item.userReaction || null
      };
    });

    return {
      id: post.id,
      content: sanitizedContent,
      category: post.category,
      attachments: post.attachments || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorRole: profile?.role || "Verified Employee",
      commentCount: enrichedComments.length,
      reactionCounts: reactionStats.counts,
      userReaction: reactionStats.userReaction,
      comments: enrichedComments,
      pollResults: await this.getPollResults(id, userId)
    };
  }

  async getPostComments(postId: number, userId: string): Promise<any[]> {
    const commentsList = await db.select({
      comment: comments,
      supportCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'comment' AND ${reactions.type} = 'support')`,
      helpfulCount: sql<number>`(SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'comment' AND ${reactions.type} = 'helpful')`,
      userReaction: sql<string | null>`(SELECT ${reactions.type} FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'comment' AND ${reactions.userId} = ${userId} LIMIT 1)`,
    })
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return commentsList.map((item: any) => ({
      ...item.comment,
      reactionCounts: {
        support: Number(item.supportCount),
        helpful: Number(item.helpfulCount)
      },
      userReaction: item.userReaction || null
    }));
  }

  async createComment(userId: string, postId: number, comment: CreateCommentInput & { parentId?: number }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values({
      ...comment,
      authorId: userId,
      postId,
      parentId: comment.parentId || null,
    }).returning();

    if (redis) {
      await this.clearPublicPostsCache();
    }

    return newComment;
  }

  async createPost(userId: string, companyId: number, post: CreatePostInput & { attachments?: any[], pollData?: any }): Promise<Post> {
    const [newPost] = await db.insert(posts).values({
      ...post,
      authorId: userId,
      companyId,
      attachments: post.attachments || [],
      pollData: post.pollData || null,
    }).returning();

    if (redis) {
      await this.clearPublicPostsCache();
    }

    return newPost;
  }

  async clearPublicPostsCache() {
    if (!redis) return;
    try {
      const keys = await redis.keys("posts:public:*");
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[STORAGE] Invalidated ${keys.length} public post cache keys.`);
      }
    } catch (err) {
      console.error("[STORAGE] Redis clear cache error:", err);
    }
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

  async getChatRequests(userId: string): Promise<any[]> {
    // Fetch requests joined with profiles to get other user role in one go
    const requestsList = await db.select({
      request: chatRequests,
      requesterRole: sql<string>`p1.role`,
      recipientRole: sql<string>`p2.role`,
      requesterCompanyId: sql<number>`p1.company_id`,
      recipientCompanyId: sql<number>`p2.company_id`,
    })
      .from(chatRequests)
      .leftJoin(sql`${profiles} p1`, eq(chatRequests.requesterId, sql`p1.user_id`))
      .leftJoin(sql`${profiles} p2`, eq(chatRequests.recipientId, sql`p2.user_id`))
      .where(sql`${chatRequests.requesterId} = ${userId} OR ${chatRequests.recipientId} = ${userId}`)
      .orderBy(desc(chatRequests.createdAt));

    // For requests with mutual reveal, we need more details
    const mutualRevealRequests = requestsList.filter(r => r.request.senderIdentityRevealed && r.request.receiverIdentityRevealed);

    // Batch fetch users and profiles if needed
    const otherUserIds = mutualRevealRequests.map(r => r.request.requesterId === userId ? r.request.recipientId : r.request.requesterId);
    const usersBatch = otherUserIds.length > 0 ? await db.select().from(users).where(inArray(users.id, otherUserIds)) : [];

    // Batch fetch companies if needed
    const companyIds = Array.from(new Set(mutualRevealRequests.map(r => r.request.requesterId === userId ? r.recipientCompanyId : r.requesterCompanyId).filter(Boolean)));
    const companiesBatch = companyIds.length > 0 ? await db.select().from(companies).where(inArray(companies.id, companyIds)) : [];

    return requestsList.map((item: any) => {
      const req = item.request;
      const isRequester = req.requesterId === userId;
      const otherUserId = isRequester ? req.recipientId : req.requesterId;
      const otherUserRole = isRequester ? item.recipientRole : item.requesterRole;
      const otherUserCompanyId = isRequester ? item.recipientCompanyId : item.requesterCompanyId;

      let otherUserProfile = undefined;
      if (req.senderIdentityRevealed && req.receiverIdentityRevealed) {
        const otherUser = usersBatch.find(u => u.id === otherUserId);
        const company = companiesBatch.find(c => c.id === otherUserCompanyId);

        otherUserProfile = {
          userId: otherUserId,
          role: otherUserRole,
          firstName: otherUser?.firstName || null,
          lastName: otherUser?.lastName || null,
          profileImageUrl: otherUser?.profileImageUrl || null,
          companyName: company?.name || "Unknown Company",
        };
      }

      return {
        ...req,
        otherUserRole: otherUserRole || "Verified Employee",
        otherUserId,
        otherUserProfile
      };
    });
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

  async getSalaries(companyId?: number, role?: string): Promise<any[]> {
    const conditions = [];
    if (companyId) conditions.push(eq(salaries.companyId, companyId));
    if (role) {
      const searchTerms = `%${role.toLowerCase()}%`;
      conditions.push(sql`lower(${salaries.role}) LIKE ${searchTerms}`);
    }

    const results = await db.select({
      salary: salaries,
      companyName: companies.name,
    })
      .from(salaries)
      .leftJoin(companies, eq(salaries.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(salaries.createdAt));

    return results.map((r: any) => ({
      ...r.salary,
      companyName: r.companyName || "Unknown Company",
    }));
  }

  async createSalary(userId: string, input: CreateSalaryInput): Promise<Salary> {
    const [salary] = await db.insert(salaries).values({
      ...input,
      userId,
    }).returning();
    return salary;
  }

  // === POLLS ===
  async votePoll(userId: string, postId: number, optionIndex: number): Promise<void> {
    await db.insert(pollVotes).values({
      userId,
      postId,
      optionIndex,
    }).onConflictDoUpdate({
      target: [pollVotes.userId, pollVotes.postId],
      set: { optionIndex, createdAt: new Date() }
    });
  }

  async getPollResults(postId: number, userId?: string): Promise<any> {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post || !post.pollData) return undefined;

    const pollData = post.pollData as { question: string, options: string[] };
    const votes = await db.select().from(pollVotes).where(eq(pollVotes.postId, postId));

    const results = pollData.options.map((option, index) => ({
      label: option,
      count: votes.filter((v: any) => v.optionIndex === index).length,
    }));

    const userVote = userId ? votes.find((v: any) => v.userId === userId) : null;

    return {
      options: results,
      totalVotes: votes.length,
      userVoteIndex: userVote?.optionIndex ?? null,
    };
  }

  async getInterviews(companyId?: number, role?: string): Promise<any[]> {
    const conditions = [];
    if (companyId) conditions.push(eq(interviews.companyId, companyId));
    if (role) {
      const searchTerms = `%${role.toLowerCase()}%`;
      conditions.push(sql`lower(${interviews.role}) LIKE ${searchTerms}`);
    }

    const results = await db.select({
      interview: interviews,
      companyName: companies.name,
    })
      .from(interviews)
      .leftJoin(companies, eq(interviews.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(interviews.createdAt));

    return results.map((r: any) => ({
      ...r.interview,
      companyName: r.companyName || "Unknown Company",
    }));
  }

  async createInterview(userId: string, input: CreateInterviewInput): Promise<Interview> {
    const [interview] = await db.insert(interviews).values({
      ...input,
      userId,
    }).returning();
    return interview;
  }

  async updateProfileSettings(userId: string, settings: any): Promise<Profile> {
    const [profile] = await db.update(profiles)
      .set({ settings })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  async setAdminStatus(userId: string, isAdmin: boolean): Promise<Profile> {
    const [profile] = await db.update(profiles)
      .set({ isAdmin })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }
}

export const storage = new DatabaseStorage();
