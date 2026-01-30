import { z } from 'zod';
import { insertPostSchema, insertCommentSchema, insertReportSchema, posts, comments, companies, profiles } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>().nullable(),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles',
      input: z.object({
        role: z.string().min(2),
        companyName: z.string().min(2), // We'll look up or create company
      }),
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts',
      input: z.object({
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect & { 
          commentCount: number; 
          reactionCounts: { support: number; helpful: number };
          userReaction: 'support' | 'helpful' | null;
        }>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/posts/:id',
      responses: {
        200: z.custom<typeof posts.$inferSelect & {
          comments: (typeof comments.$inferSelect & {
             reactionCounts: { support: number; helpful: number };
             userReaction: 'support' | 'helpful' | null;
          })[];
          reactionCounts: { support: number; helpful: number };
          userReaction: 'support' | 'helpful' | null;
        }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts',
      input: insertPostSchema,
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  comments: {
    create: {
      method: 'POST' as const,
      path: '/api/posts/:id/comments',
      input: insertCommentSchema,
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  reactions: {
    toggle: {
      method: 'POST' as const,
      path: '/api/reactions',
      input: z.object({
        targetType: z.enum(['post', 'comment']),
        targetId: z.number(),
        type: z.enum(['support', 'helpful']),
      }),
      responses: {
        200: z.object({ success: z.boolean(), action: z.enum(['added', 'removed']) }),
      },
    },
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPES
// ============================================
export type PostResponse = z.infer<typeof api.posts.get.responses[200]>;
export type PostsListResponse = z.infer<typeof api.posts.list.responses[200]>;
