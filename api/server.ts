import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors() as any);
app.use(express.json() as any);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const formatUser = (row: any) => ({
  uid: row.uid,
  displayName: row.display_name,
  photoURL: row.photo_url || '',
  bio: row.bio,
  level: row.level,
  streak: row.streak,
  totalSessions: row.total_sessions,
});

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// ─── Users ─────────────────────────────────────────────────────────────────
app.get('/api/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/user', async (req, res) => {
  try {
    const { uid, displayName, photoURL, bio, level, totalSessions } = req.body;
    const result = await pool.query(
      `INSERT INTO users (uid, display_name, photo_url, bio, level, total_sessions)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (uid)
       DO UPDATE SET display_name = EXCLUDED.display_name, bio = EXCLUDED.bio
       RETURNING *`,
      [uid, displayName, photoURL || '', bio || '', level || 1, totalSessions || 0]
    );
    res.status(201).json(formatUser(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error during user creation' });
  }
});

app.put('/api/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { display_name, bio, level, total_sessions } = req.body;
    const result = await pool.query(
      'UPDATE users SET display_name=$1, bio=$2, level=$3, total_sessions=$4 WHERE uid=$5 RETURNING *',
      [display_name, bio, level, total_sessions, uid]
    );
    res.json(formatUser(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── Pomodoro ───────────────────────────────────────────────────────────────
app.post('/api/pomo/complete', async (req, res) => {
  try {
    const { uid } = req.body;
    await pool.query(
      'UPDATE users SET level = level + 1, total_sessions = total_sessions + 1 WHERE uid = $1',
      [uid]
    );
    await pool.query(
      `INSERT INTO daily_stats (user_uid, session_count)
       VALUES ($1, 1)
       ON CONFLICT (user_uid, stat_date)
       DO UPDATE SET session_count = daily_stats.session_count + 1`,
      [uid]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── Daily Stats (for streak chart) ────────────────────────────────────────
app.get('/api/stats/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await pool.query(
      `SELECT stat_date, session_count FROM daily_stats
       WHERE user_uid = $1
       ORDER BY stat_date DESC
       LIMIT 30`,
      [uid]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── Notes ──────────────────────────────────────────────────────────────────
app.get('/api/notes/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_uid = $1 ORDER BY created_at DESC',
      [uid]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/notes/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { title, content } = req.body;
    const result = await pool.query(
      'INSERT INTO notes (user_uid, title, content) VALUES ($1, $2, $3) RETURNING *',
      [uid, title, content]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: new Date(row.created_at).getTime(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/notes/:uid/:noteId', async (req, res) => {
  try {
    const { uid, noteId } = req.params;
    await pool.query('DELETE FROM notes WHERE id = $1 AND user_uid = $2', [noteId, uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── Quizzes ────────────────────────────────────────────────────────────────
app.get('/api/quizzes/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const quizResult = await pool.query(
      'SELECT * FROM quizzes WHERE user_uid = $1 ORDER BY created_at DESC',
      [uid]
    );
    // Attach cards to each quiz
    const quizzes = await Promise.all(
      quizResult.rows.map(async (quiz) => {
        const cardResult = await pool.query(
          'SELECT * FROM flashcards WHERE quiz_id = $1 ORDER BY created_at ASC',
          [quiz.id]
        );
        return {
          id: quiz.id,
          title: quiz.title,
          cards: cardResult.rows.map((c) => ({
            id: c.id,
            question: c.question,
            answer: c.answer,
          })),
        };
      })
    );
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/quizzes/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { title } = req.body;
    const result = await pool.query(
      'INSERT INTO quizzes (user_uid, title) VALUES ($1, $2) RETURNING *',
      [uid, title]
    );
    res.status(201).json({ id: result.rows[0].id, title: result.rows[0].title, cards: [] });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/quizzes/:uid/:quizId', async (req, res) => {
  try {
    const { uid, quizId } = req.params;
    await pool.query('DELETE FROM quizzes WHERE id = $1 AND user_uid = $2', [quizId, uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── Flashcards ─────────────────────────────────────────────────────────────
app.post('/api/quizzes/:uid/:quizId/cards', async (req, res) => {
  try {
    const { uid, quizId } = req.params;
    const { question, answer } = req.body;
    // Verify the quiz belongs to this user
    const quizCheck = await pool.query(
      'SELECT id FROM quizzes WHERE id = $1 AND user_uid = $2',
      [quizId, uid]
    );
    if (quizCheck.rows.length === 0) return res.status(403).json({ error: 'Forbidden' });

    const result = await pool.query(
      'INSERT INTO flashcards (quiz_id, question, answer) VALUES ($1, $2, $3) RETURNING *',
      [quizId, question, answer]
    );
    const c = result.rows[0];
    res.status(201).json({ id: c.id, question: c.question, answer: c.answer });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/quizzes/:uid/:quizId/cards/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    await pool.query('DELETE FROM flashcards WHERE id = $1', [cardId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Pomogrove server running on port ${PORT}`);
});

// ─── Playlists ───────────────────────────────────────────────────────────────
app.get('/api/playlists/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const playlists = await pool.query(
      'SELECT * FROM playlists WHERE user_uid = $1 ORDER BY created_at DESC',
      [uid]
    );
    const result = await Promise.all(
      playlists.rows.map(async (pl) => {
        const items = await pool.query(
          'SELECT * FROM playlist_items WHERE playlist_id = $1 ORDER BY created_at ASC',
          [pl.id]
        );
        return { id: pl.id, name: pl.name, items: items.rows };
      })
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/playlists/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { name } = req.body;
    const count = await pool.query('SELECT COUNT(*) FROM playlists WHERE user_uid = $1', [uid]);
    if (parseInt(count.rows[0].count) >= 10)
      return res.status(400).json({ error: 'Max 10 playlists reached' });
    const result = await pool.query(
      'INSERT INTO playlists (user_uid, name) VALUES ($1, $2) RETURNING *',
      [uid, name]
    );
    res.status(201).json({ ...result.rows[0], items: [] });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

app.delete('/api/playlists/:uid/:playlistId', async (req, res) => {
  try {
    const { uid, playlistId } = req.params;
    await pool.query('DELETE FROM playlists WHERE id = $1 AND user_uid = $2', [playlistId, uid]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/playlists/:uid/:playlistId/items', async (req, res) => {
  try {
    const { uid, playlistId } = req.params;
    const { title, youtubeId } = req.body;
    const check = await pool.query(
      'SELECT id FROM playlists WHERE id = $1 AND user_uid = $2', [playlistId, uid]
    );
    if (check.rows.length === 0) return res.status(403).json({ error: 'Forbidden' });
    const count = await pool.query(
      'SELECT COUNT(*) FROM playlist_items WHERE playlist_id = $1', [playlistId]
    );
    if (parseInt(count.rows[0].count) >= 20)
      return res.status(400).json({ error: 'Max 20 items per playlist' });
    const result = await pool.query(
      'INSERT INTO playlist_items (playlist_id, title, youtube_id) VALUES ($1, $2, $3) RETURNING *',
      [playlistId, title, youtubeId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

app.delete('/api/playlists/:uid/:playlistId/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    await pool.query('DELETE FROM playlist_items WHERE id = $1', [itemId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});