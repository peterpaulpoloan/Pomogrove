import { 
  users, type User, type InsertUser,
  notes, type Note, type InsertNote,
  quizzes, type Quiz, type InsertQuiz,
  pomodoroSessions, type PomodoroSession, type InsertPomodoroSession,
  userStats, type UserStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Notes
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, updates: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // Quizzes
  getQuizzes(userId: string): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;

  // Pomodoro
  logPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  getPomodoroHistory(userId: string): Promise<PomodoroSession[]>;

  // Stats
  getUserStats(userId: string): Promise<UserStats | undefined>;
  updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats>;
  ensureUserStats(userId: string): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
  // Notes
  async getNotes(userId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: number, updates: Partial<InsertNote>): Promise<Note> {
    const [updatedNote] = await db.update(notes).set({ ...updates, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
    return updatedNote;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Quizzes
  async getQuizzes(userId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.createdAt));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Pomodoro
  async logPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    const [newSession] = await db.insert(pomodoroSessions).values(session).returning();
    return newSession;
  }

  async getPomodoroHistory(userId: string): Promise<PomodoroSession[]> {
    return await db.select().from(pomodoroSessions).where(eq(pomodoroSessions.userId, userId)).orderBy(desc(pomodoroSessions.completedAt));
  }

  // Stats
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async ensureUserStats(userId: string): Promise<UserStats> {
    let stats = await this.getUserStats(userId);
    if (!stats) {
      const [newStats] = await db.insert(userStats).values({ userId }).returning();
      stats = newStats;
    }
    return stats;
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
    await this.ensureUserStats(userId);
    const [stats] = await db.update(userStats).set(updates).where(eq(userStats.userId, userId)).returning();
    return stats;
  }
}

export const storage = new DatabaseStorage();
