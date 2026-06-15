import { SMS_CODE } from '@/helpers/constants';
import { verifyMacroDroid } from '@/lib/utils';
import { redis } from '@/services/redis';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!verifyMacroDroid(req, res)) {
    return;
  }

  const { code } = req.body;

  try {
    redis.set(SMS_CODE, code);
  } catch (error) {
    console.error('error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
