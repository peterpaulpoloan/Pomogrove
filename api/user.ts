import { neon } from '@neondatabase/serverless';
const fmt = (u: any) => ({ uid: u.uid, displayName: u.display_name, photoURL: u.photo_url || '', bio: u.bio, level: u.level, streak: u.streak, totalSessions: u.total_sessions });

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const uid = req.query.uid;

  if (req.method === 'GET' && uid) {
    const rows = await sql`SELECT * FROM users WHERE uid = ${uid}`;
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    return res.json(fmt(rows[0]));
  }
  if (req.method === 'POST') {
    const { uid, displayName, photoURL, bio, level, totalSessions } = req.body;
    const rows = await sql`
      INSERT INTO users (uid, display_name, photo_url, bio, level, total_sessions)
      VALUES (${uid}, ${displayName}, ${photoURL||''}, ${bio||''}, ${level||1}, ${totalSessions||0})
      ON CONFLICT (uid) DO UPDATE SET display_name=EXCLUDED.display_name, bio=EXCLUDED.bio
      RETURNING *`;
    return res.status(201).json(fmt(rows[0]));
  }
  if (req.method === 'PUT' && uid) {
    const { display_name, bio, level, total_sessions } = req.body;
    const rows = await sql`UPDATE users SET display_name=${display_name}, bio=${bio}, level=${level}, total_sessions=${total_sessions} WHERE uid=${uid} RETURNING *`;
    return res.json(fmt(rows[0]));
  }
  res.status(405).end();
}