import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const [rows] = await db.query('SELECT * FROM tickets WHERE user_id = ?', [user.id]);
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Brak danych' });

    await db.query(
      'INSERT INTO tickets (user_id, title, description) VALUES (?, ?, ?)',
      [user.id, title, description]
    );
    return res.status(201).json({ success: true });
  }

  return res.status(405).end();
}
