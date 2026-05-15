import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const sql = neon(process.env.DATABASE_URL!);
  const { uid } = req.body;
  await sql`UPDATE users SET level = level + 1, total_sessions = total_sessions + 1 WHERE uid = ${uid}`;
  await sql`
    INSERT INTO daily_stats (user_uid, session_count) VALUES (${uid}, 1)
    ON CONFLICT (user_uid, stat_date) DO UPDATE SET session_count = daily_stats.session_count + 1`;
  res.json({ success: true });
}