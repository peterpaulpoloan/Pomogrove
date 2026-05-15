import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const { uid, quizId, cardId } = req.query;

  if (cardId) {
    if (req.method === 'DELETE') {
      await sql`DELETE FROM flashcards WHERE id = ${cardId}`;
      return res.json({ success: true });
    }
  }
  if (quizId && !cardId) {
    if (req.method === 'DELETE') {
      await sql`DELETE FROM quizzes WHERE id = ${quizId} AND user_uid = ${uid}`;
      return res.json({ success: true });
    }
    if (req.method === 'POST') {
      const check = await sql`SELECT id FROM quizzes WHERE id = ${quizId} AND user_uid = ${uid}`;
      if (!check.length) return res.status(403).json({ error: 'Forbidden' });
      const { question, answer } = req.body;
      const rows = await sql`INSERT INTO flashcards (quiz_id, question, answer) VALUES (${quizId}, ${question}, ${answer}) RETURNING *`;
      return res.status(201).json({ id: rows[0].id, question: rows[0].question, answer: rows[0].answer });
    }
  }
  if (req.method === 'GET') {
    const quizzes = await sql`SELECT * FROM quizzes WHERE user_uid = ${uid} ORDER BY created_at DESC`;
    const result = await Promise.all(quizzes.map(async (quiz) => {
      const cards = await sql`SELECT * FROM flashcards WHERE quiz_id = ${quiz.id} ORDER BY created_at ASC`;
      return { id: quiz.id, title: quiz.title, cards: cards.map((c: any) => ({ id: c.id, question: c.question, answer: c.answer })) };
    }));
    return res.json(result);
  }
  if (req.method === 'POST') {
    const { title } = req.body;
    const rows = await sql`INSERT INTO quizzes (user_uid, title) VALUES (${uid}, ${title}) RETURNING *`;
    return res.status(201).json({ id: rows[0].id, title: rows[0].title, cards: [] });
  }
  res.status(405).end();
}