import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { status } = req.body;
    if (!['nowy', 'realizowany', 'zamknięty'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    await db.query(
      'UPDATE tickets SET status = ? WHERE id = ? AND user_id = ?',
      [status, id, user.id]
    );
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
