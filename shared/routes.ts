import { z } from 'zod';
import { insertPostSchema, insertCommentSchema, insertReportSchema, insertWeeklyCheckinSchema, insertLinkedinExchangeSchema, insertSalarySchema, insertInterviewSchema, insertPollVoteSchema, posts, comments, companies, profiles, weeklyCheckins, linkedinExchanges, reports, salaries, interviews, pollVotes } from './schema.js';

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
  forbidden: z.object({
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
        200: z.custom<typeof profiles.$inferSelect & {
          companyName: string;
          maskedEmail: string;
          firstName: string | null;
          lastName: string | null;
          profileImageUrl: string | null;
        }>().nullable(),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles',
      input: z.object({
        role: z.string().min(2).max(50),
        companyName: z.string().min(2),
        linkedinUrl: z.string().url().optional().or(z.literal("")),
        interests: z.array(z.string()).optional(),
        persona: z.object({
          avatarUrl: z.string().optional(),
          themeColor: z.string().optional(),
        }).optional(),
      }),
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateRole: {
      method: 'PATCH' as const,
      path: '/api/profiles/role',
      input: z.object({
        role: z.string().min(2).max(50),
      }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateLinkedInUrl: {
      method: 'PATCH' as const,
      path: '/api/profiles/linkedin-url',
      input: z.object({
        linkedinUrl: z.string().url(),
      }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/profiles/me',
      input: z.object({
        confirmation: z.literal('DELETE'),
      }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    logoutAll: {
      method: 'POST' as const,
      path: '/api/profiles/logout-all',
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
      },
    },
  },
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts',
      input: z.object({
        category: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect & {
          commentCount: number;
          reactionCounts: { support: number; helpful: number };
          userReaction: 'support' | 'helpful' | null;
          pollResults?: { options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null };
        }>()),
        401: errorSchemas.unauthorized,
      },
    },
    publicList: {
      method: 'GET' as const,
      path: '/api/posts/public',
      input: z.object({
        category: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<Omit<typeof posts.$inferSelect, 'companyId' | 'authorId'> & {
          commentCount: number;
          reactionCounts: { support: number; helpful: number };
          authorRole: string | null;
          userReaction: 'support' | 'helpful' | null;
          pollResults?: { options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null };
        }>()),
      },
    },
    publicGet: {
      method: 'GET' as const,
      path: '/api/posts/public/:id',
      responses: {
        200: z.custom<Omit<typeof posts.$inferSelect, 'companyId' | 'authorId'> & {
          comments: (Omit<typeof comments.$inferSelect, 'authorId'> & { authorRole: string | null; reactionCounts: { support: number; helpful: number } })[];
          reactionCounts: { support: number; helpful: number };
          authorRole: string | null;
          userReaction: 'support' | 'helpful' | null;
          pollResults?: { options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null };
        }>(),
        404: errorSchemas.notFound,
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
          pollResults?: { options: { label: string; count: number }[]; totalVotes: number; userVoteIndex?: number | null };
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
    vote: {
      method: "POST" as const,
      path: "/api/posts/:id/vote",
      input: z.object({ optionIndex: z.number() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  interviews: {
    list: {
      method: 'GET' as const,
      path: '/api/interviews',
      input: z.object({
        companyId: z.coerce.number().optional(),
        role: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof interviews.$inferSelect & { companyName: string }>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/interviews',
      input: insertInterviewSchema,
      responses: {
        201: z.custom<typeof interviews.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    reports: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/reports',
        responses: {
          200: z.array(z.custom<typeof reports.$inferSelect>()),
          401: errorSchemas.unauthorized,
          403: errorSchemas.forbidden,
        },
      },
      resolve: {
        method: 'POST' as const,
        path: '/api/admin/reports/:id/resolve',
        input: z.object({ resolution: z.enum(['dismissed', 'resolved']) }),
        responses: {
          200: z.object({ success: z.boolean() }),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          403: errorSchemas.forbidden,
        },
      },
    },
    stats: {
      get: {
        method: 'GET' as const,
        path: '/api/admin/stats',
        responses: {
          200: z.object({
            userCount: z.number(),
            postCount: z.number(),
            reportCount: z.number(),
          }),
          401: errorSchemas.unauthorized,
          403: errorSchemas.forbidden,
        },
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/user/settings',
      responses: {
        200: z.any(), // Settings object structure is flexible
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/user/settings',
      input: z.any(),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
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
  communities: {
    search: {
      method: 'GET' as const,
      path: '/api/companies/search',
      responses: {
        200: z.array(z.custom<typeof companies.$inferSelect>()),
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
  weeklyCheckins: {
    create: {
      method: 'POST' as const,
      path: '/api/checkins',
      input: insertWeeklyCheckinSchema,
      responses: {
        201: z.custom<typeof weeklyCheckins.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    getMine: {
      method: 'GET' as const,
      path: '/api/checkins/mine',
      responses: {
        200: z.custom<typeof weeklyCheckins.$inferSelect | undefined>().nullable(),
      }
    },
    getAggregated: {
      method: 'GET' as const,
      path: '/api/checkins/aggregated',
      responses: {
        200: z.object({
          averageMood: z.number(),
          totalCheckins: z.number(),
          categoryCounts: z.record(z.number()),
          moodCounts: z.array(z.object({
            moodScore: z.number(),
            count: z.number(),
          })),
        }),
      }
    }
  },
  exchange: {
    request: {
      method: 'POST' as const,
      path: '/api/exchange/request',
      input: z.object({
        recipientId: z.string(),
        introMessage: z.string().min(1).max(500),
      }),
      responses: {
        201: z.custom<typeof linkedinExchanges.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    respond: {
      method: 'POST' as const,
      path: '/api/exchange/:id/respond',
      input: z.object({ status: z.enum(['accepted', 'rejected', 'ignored']) }),
      responses: {
        200: z.custom<typeof linkedinExchanges.$inferSelect>(),
      }
    },
    reveal: {
      method: 'POST' as const,
      path: '/api/exchange/:id/reveal',
      input: z.object({ agree: z.boolean() }),
      responses: {
        200: z.object({
          success: z.boolean(),
          mutualReveal: z.boolean(),
          otherUserProfile: z.custom<typeof profiles.$inferSelect & {
            companyName: string;
            firstName: string | null;
            lastName: string | null;
            profileImageUrl: string | null;
          }>().optional(),
        }),
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/exchange/requests',
      responses: {
        200: z.array(z.custom<typeof linkedinExchanges.$inferSelect & {
          otherUserRole: string | null;
          otherUserId: string;
          otherUserProfile?: typeof profiles.$inferSelect & {
            companyName: string;
            firstName: string | null;
            lastName: string | null;
            profileImageUrl: string | null;
          };
        }>()),
      }
    }
  },
  reports: {
    create: {
      method: 'POST' as const,
      path: '/api/reports',
      input: insertReportSchema,
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/exchange/:id/messages',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          senderId: z.string(),
          content: z.string(),
          createdAt: z.string(),
          isMine: z.boolean(),
        })),
      }
    },
    send: {
      method: 'POST' as const,
      path: '/api/exchange/:id/messages',
      input: z.object({ content: z.string().min(1).max(2000) }),
      responses: {
        201: z.object({
          id: z.number(),
          senderId: z.string(),
          content: z.string(),
          createdAt: z.string(),
          isMine: z.boolean(),
        }),
      }
    }
  },
  safety: {
    block: {
      method: 'POST' as const,
      path: '/api/safety/block',
      input: z.object({ userId: z.string() }),
      responses: {
        201: z.object({ success: z.boolean(), message: z.string() }),
        400: errorSchemas.validation,
      }
    },
    unblock: {
      method: 'POST' as const,
      path: '/api/safety/unblock',
      input: z.object({ userId: z.string() }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
      }
    },
    listBlocked: {
      method: 'GET' as const,
      path: '/api/safety/blocked',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          blockedId: z.string(),
          createdAt: z.string(),
        })),
      }
    }
  },
  salaries: {
    list: {
      method: 'GET' as const,
      path: '/api/salaries',
      input: z.object({
        companyId: z.coerce.number().optional(),
        role: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof salaries.$inferSelect & { companyName: string }>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/salaries',
      input: insertSalarySchema,
      responses: {
        201: z.custom<typeof salaries.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
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
