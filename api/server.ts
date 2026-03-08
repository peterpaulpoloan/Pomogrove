
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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
  totalSessions: row.total_sessions
});

// Health check endpoint for frontend auto-sync
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

app.get('/api/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
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
      'UPDATE users SET display_name = $1, bio = $2, level = $3, total_sessions = $4 WHERE uid = $5 RETURNING *',
      [display_name, bio, level, total_sessions, uid]
    );
    res.json(formatUser(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/pomo/complete', async (req, res) => {
  try {
    const { uid } = req.body;
    await pool.query('UPDATE users SET level = level + 1, total_sessions = total_sessions + 1 WHERE uid = $1', [uid]);
    await pool.query(`
      INSERT INTO daily_stats (user_uid, session_count) 
      VALUES ($1, 1)
      ON CONFLICT (user_uid, stat_date) 
      DO UPDATE SET session_count = daily_stats.session_count + 1
    `, [uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
