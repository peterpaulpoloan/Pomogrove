import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated } from "./auth/middleware";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === NOTES ROUTES ===
  app.get(api.notes.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const notes = await storage.getNotes(userId);
    res.json(notes);
  });

  app.get(api.notes.get.path, isAuthenticated, async (req, res) => {
    const note = await storage.getNote(Number(req.params.id));
    if (!note) return res.status(404).json({ message: "Note not found" });
    // Verify ownership
    if (note.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(note);
  });

  app.post(api.notes.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.notes.create.input.parse(req.body);
      const note = await storage.createNote({ ...input, userId });
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.notes.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const id = Number(req.params.id);
      const existing = await storage.getNote(id);
      if (!existing) return res.status(404).json({ message: "Note not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      const input = api.notes.update.input.parse(req.body);
      const updated = await storage.updateNote(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.notes.delete.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = Number(req.params.id);
    const existing = await storage.getNote(id);
    if (!existing) return res.status(404).json({ message: "Note not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteNote(id);
    res.status(204).send();
  });

  // === QUIZ ROUTES ===
  app.get(api.quizzes.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const quizzes = await storage.getQuizzes(userId);
    res.json(quizzes);
  });

  app.post(api.quizzes.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.quizzes.create.input.parse(req.body);
      const quiz = await storage.createQuiz({ ...input, userId });
      res.status(201).json(quiz);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.quizzes.get.path, isAuthenticated, async (req, res) => {
    const quiz = await storage.getQuiz(Number(req.params.id));
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    // Verify ownership
    if (quiz.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(quiz);
  });

  app.delete(api.quizzes.delete.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = Number(req.params.id);
    const existing = await storage.getQuiz(id);
    if (!existing) return res.status(404).json({ message: "Quiz not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteQuiz(id);
    res.status(204).send();
  });

  app.post(api.quizzes.checkAnswer.path, isAuthenticated, async (req, res) => {
    try {
      const { question, userAnswer, correctAnswer } = api.quizzes.checkAnswer.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are a teacher grading a student's answer. Compare the user's answer to the correct answer. Be lenient with phrasing but strict with facts. Return a JSON object with 'correct' (boolean) and 'feedback' (string)." },
          { role: "user", content: `Question: ${question}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}` }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json({
        correct: !!result.correct,
        feedback: result.feedback || "No feedback provided."
      });

    } catch (err) {
      console.error("AI Check Error:", err);
      res.status(500).json({ message: "Failed to check answer" });
    }
  });

  // === POMODORO ROUTES ===
  app.post(api.pomodoro.log.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { duration, completed } = api.pomodoro.log.input.parse(req.body);
      
      // Log session
      const session = await storage.logPomodoroSession({
        userId,
        duration,
        completed
      });

      // Update stats
      const stats = await storage.ensureUserStats(userId);
      let newLevel = stats.level || 1;
      let newExp = (stats.experience || 0) + (completed ? 10 : 1); // 10 XP for completion, 1 for partial
      let newStudyTime = (stats.totalStudyMinutes || 0) + duration;
      
      // Level up logic (simple: 100 XP per level)
      if (newExp >= 100) {
        newLevel++;
        newExp -= 100;
      }

      // Tree stage logic
      let newTreeStage = stats.treeStage || "sapling";
      if (newLevel >= 5) newTreeStage = "juvenile";
      if (newLevel >= 10) newTreeStage = "adult";

      const updatedStats = await storage.updateUserStats(userId, {
        level: newLevel,
        experience: newExp,
        totalStudyMinutes: newStudyTime,
        treeStage: newTreeStage,
        lastStudyDate: new Date(),
      });

      res.status(201).json({ session, stats: updatedStats });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.pomodoro.history.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const history = await storage.getPomodoroHistory(userId);
    res.json(history);
  });

  // === STATS ROUTES ===
  app.get(api.stats.get.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const stats = await storage.ensureUserStats(userId);
    res.json(stats);
  });

  return httpServer;
}