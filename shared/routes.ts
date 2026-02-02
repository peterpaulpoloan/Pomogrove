import { z } from 'zod';
import { insertNoteSchema, notes, insertQuizSchema, quizzes, insertPomodoroSessionSchema, pomodoroSessions, userStats } from './schema';

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
  notes: {
    list: {
      method: 'GET' as const,
      path: '/api/notes',
      responses: {
        200: z.array(z.custom<typeof notes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/notes/:id',
      responses: {
        200: z.custom<typeof notes.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/notes',
      input: insertNoteSchema.omit({ userId: true }), // userId comes from session
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/notes/:id',
      input: insertNoteSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  quizzes: {
    list: {
      method: 'GET' as const,
      path: '/api/quizzes',
      responses: {
        200: z.array(z.custom<typeof quizzes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/quizzes',
      input: insertQuizSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof quizzes.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/quizzes/:id',
      responses: {
        200: z.custom<typeof quizzes.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/quizzes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    checkAnswer: {
      method: 'POST' as const,
      path: '/api/quizzes/check',
      input: z.object({
        question: z.string(),
        userAnswer: z.string(),
        correctAnswer: z.string(),
      }),
      responses: {
        200: z.object({
          correct: z.boolean(),
          feedback: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    }
  },
  pomodoro: {
    log: {
      method: 'POST' as const,
      path: '/api/pomodoro/log',
      input: z.object({
        duration: z.number().int().positive(),
        completed: z.boolean(),
      }),
      responses: {
        201: z.object({
          session: z.custom<typeof pomodoroSessions.$inferSelect>(),
          stats: z.custom<typeof userStats.$inferSelect>(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/pomodoro/history',
      responses: {
        200: z.array(z.custom<typeof pomodoroSessions.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    }
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.custom<typeof userStats.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
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
// TYPE HELPERS
// ============================================
export type CreateNoteInput = z.infer<typeof api.notes.create.input>;
export type UpdateNoteInput = z.infer<typeof api.notes.update.input>;
export type CreateQuizInput = z.infer<typeof api.quizzes.create.input>;
export type CheckAnswerInput = z.infer<typeof api.quizzes.checkAnswer.input>;
export type CheckAnswerResponse = z.infer<typeof api.quizzes.checkAnswer.responses[200]>;
export type LogPomodoroInput = z.infer<typeof api.pomodoro.log.input>;
