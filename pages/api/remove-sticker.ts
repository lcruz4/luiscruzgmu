import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/services/db';
import { getAuthenticatedEmail } from '@/services/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = await getAuthenticatedEmail(req.headers.cookie);
  if (!email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { category, index } = req.body;

  if (!category || index === undefined) {
    return res.status(400).json({ error: 'Category and index are required' });
  }

  try {
    const client = await pool.connect();

    // Find the existing record
    const selectQuery = 'SELECT id, stickers FROM reward_charts WHERE email = $1 AND category = $2';
    const selectResult = await client.query(selectQuery, [email, category]);

    if (selectResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Record not found' });
    }

    const record = selectResult.rows[0];
    const currentStickers = record.stickers || '';
    const stickersArray = currentStickers ? currentStickers.split(',') : [];

    // Check if index is valid
    if (index < 0 || index >= stickersArray.length) {
      client.release();
      return res.status(400).json({ error: 'Invalid index' });
    }

    // Remove the sticker at the specified index
    stickersArray.splice(index, 1);
    const updatedStickers = stickersArray.join(',');

    // Update the record
    const updateQuery = 'UPDATE reward_charts SET stickers = $1 WHERE id = $2';
    await client.query(updateQuery, [updatedStickers, record.id]);

    client.release();

    return res.status(200).json({
      success: true,
      message: 'Sticker removed successfully',
      stickers: updatedStickers
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}