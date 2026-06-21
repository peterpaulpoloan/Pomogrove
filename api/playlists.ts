import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const { uid, playlistId, itemId } = req.query;

  if (itemId && itemId !== 'new') {
    if (req.method === 'DELETE') {
      await sql`DELETE FROM playlist_items WHERE id = ${itemId}`;
      return res.json({ success: true });
    }
  }
  if (playlistId && (itemId === 'new' || req.query.addItem)) {
    if (req.method === 'POST') {
      const check = await sql`SELECT id FROM playlists WHERE id = ${playlistId} AND user_uid = ${uid}`;
      if (!check.length) return res.status(403).json({ error: 'Forbidden' });
      const count = await sql`SELECT COUNT(*) FROM playlist_items WHERE playlist_id = ${playlistId}`;
      if (parseInt(count[0].count) >= 20) return res.status(400).json({ error: 'Max 20 items' });
      const { title, youtubeId } = req.body;
      const rows = await sql`INSERT INTO playlist_items (playlist_id, title, youtube_id) VALUES (${playlistId}, ${title}, ${youtubeId}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
  }
  if (playlistId && !itemId) {
    if (req.method === 'DELETE') {
      await sql`DELETE FROM playlists WHERE id = ${playlistId} AND user_uid = ${uid}`;
      return res.json({ success: true });
    }
  }
  if (req.method === 'GET') {
    const playlists = await sql`SELECT * FROM playlists WHERE user_uid = ${uid} ORDER BY created_at DESC`;
    const result = await Promise.all(playlists.map(async (pl: any) => {
      const items = await sql`SELECT * FROM playlist_items WHERE playlist_id = ${pl.id} ORDER BY created_at ASC`;
      return { id: pl.id, name: pl.name, items };
    }));
    return res.json(result);
  }
  if (req.method === 'POST') {
    const { name } = req.body;
    const count = await sql`SELECT COUNT(*) FROM playlists WHERE user_uid = ${uid}`;
    if (parseInt(count[0].count) >= 10) return res.status(400).json({ error: 'Max 10 playlists' });
    const rows = await sql`INSERT INTO playlists (user_uid, name) VALUES (${uid}, ${name}) RETURNING *`;
    return res.status(201).json({ ...rows[0], items: [] });
  }
  res.status(405).end();
}import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const { uid, playlistId, itemId } = req.query;

  if (itemId && itemId !== 'new') {
    if (req.method === 'DELETE') {
      await sql`DELETE FROM playlist_items WHERE id = ${itemId}`;
      return res.json({ success: true });
    }
  }
  if (playlistId && (itemId === 'new' || req.query.addItem)) {
    if (req.method === 'POST') {
      const check = await sql`SELECT id FROM playlists WHERE id = ${playlistId} AND user_uid = ${uid}`;
      if (!check.length) return res.status(403).json({ error: 'Forbidden' });
      const count = await sql`SELECT COUNT(*) FROM playlist_items WHERE playlist_id = ${playlistId}`;
      if (parseInt(count[0].count) >= 20) return res.status(400).json({ error: 'Max 20 items' });
      const { title, youtubeId } = req.body;
      const rows = await sql`INSERT INTO playlist_items (playlist_id, title, youtube_id) VALUES (${playlistId}, ${title}, ${youtubeId}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
  }
  if (playlistId && !itemId) {
    if (req.method === 'DELETE') {
      await sql`DELETE FROM playlists WHERE id = ${playlistId} AND user_uid = ${uid}`;
      return res.json({ success: true });
    }
  }
  if (req.method === 'GET') {
    const playlists = await sql`SELECT * FROM playlists WHERE user_uid = ${uid} ORDER BY created_at DESC`;
    const result = await Promise.all(playlists.map(async (pl: any) => {
      const items = await sql`SELECT * FROM playlist_items WHERE playlist_id = ${pl.id} ORDER BY created_at ASC`;
      return { id: pl.id, name: pl.name, items };
    }));
    return res.json(result);
  }
  if (req.method === 'POST') {
    const { name } = req.body;
    const count = await sql`SELECT COUNT(*) FROM playlists WHERE user_uid = ${uid}`;
    if (parseInt(count[0].count) >= 10) return res.status(400).json({ error: 'Max 10 playlists' });
    const rows = await sql`INSERT INTO playlists (user_uid, name) VALUES (${uid}, ${name}) RETURNING *`;
    return res.status(201).json({ ...rows[0], items: [] });
  }
  res.status(405).end();
}