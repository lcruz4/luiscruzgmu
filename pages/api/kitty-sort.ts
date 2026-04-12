import { verifyMacroDroid } from '@/lib/utils';
import { spawn } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!process.env.KITTY_SORT_SOLVER_PATH) {
    return res.status(500).json({ error: 'Kitty sort solver path not configured' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!verifyMacroDroid(req, res)) {
    return;
  }

  const { input } = req.body as { input: string; };
  const fInput = input.trim().toLowerCase().split(' ');
  if (fInput[0] !== 'size') {
    return res.status(400).json({ error: 'Invalid input format' });
  }
  const size = fInput[1];
  spawn('node', [
    '--experimental-transform-types',
    process.env.KITTY_SORT_SOLVER_PATH,
    '-a',
    '-s',
    size,
    '-i',
    fInput.slice(2).join(' '),
  ]);
  res.status(200).json({ message: 'Kitty sort solver started' });
}
