import { 
  users, profiles, companies, posts, comments, reactions, reports,
  type User, type Profile, type Company, type Post, type Comment, type Reaction, type Report,
  type CreatePostInput, type CreateCommentInput,
  type UpsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth";

export interface IStorage {
  // Auth & Profile
  getUser(id: string): Promise<User | undefined>;
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(userId: string, role: string, companyName: string): Promise<Profile>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(sql`lower(${companies.name}) = lower(${name})`);
    return company;
  }

  async createProfile(userId: string, role: string, companyName: string): Promise<Profile> {
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
      isVerified: true, // Auto-verify for MVP demo
    }).returning();
    
    return profile;
  }

  async getCompanyPosts(companyId: number, userId: string, category?: string): Promise<any[]> {
    const conditions = [eq(posts.companyId, companyId)];
    if (category) {
      conditions.push(eq(posts.category, category));
    }

    const postsList = await db.select().from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt));

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
