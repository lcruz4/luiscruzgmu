import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/services/db';
import { getAuthenticatedEmail } from '@/services/auth';

export async function getStickers(email: string, category: string) {
  const client = await pool.connect();

  try {
    // Find the existing record
    const selectQuery = 'SELECT stickers FROM reward_charts WHERE email = $1 AND category = $2';
    const selectResult = await client.query(selectQuery, [email, category]);

    if (selectResult.rows.length === 0) {
      return {
        found: false,
        stickers: [],
        stickersString: ''
      };
    }

    const record = selectResult.rows[0];
    const stickers = record.stickers || '';
    const stickersArray = stickers ? stickers.split(',') : [];

    return {
      found: true,
      stickers: stickersArray,
      stickersString: stickers
    };
  } finally {
    client.release();
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = await getAuthenticatedEmail(req.headers.cookie);
  if (!email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { category } = req.query;

  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const result = await getStickers(email, category);

    if (!result.found) {
      return res.status(404).json({ error: 'Record not found' });
    }

    return res.status(200).json({
      success: true,
      email,
      category,
      stickers: result.stickers,
      stickersString: result.stickersString
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}