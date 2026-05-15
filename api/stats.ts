import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const { uid } = req.query;
  const rows = await sql`SELECT stat_date, session_count FROM daily_stats WHERE user_uid = ${uid} ORDER BY stat_date DESC LIMIT 30`;
  res.json(rows);
}