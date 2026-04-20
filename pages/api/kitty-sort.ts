import { verifyMacroDroid } from '@/lib/utils';
import { spawn } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!process.env.KITTY_SORT_SOLVER_PATH) {
    console.error('KITTY_SORT_SOLVER_PATH environment variable is not set');
    return res
      .status(500)
      .json({ error: 'Internal Server Error' });
  }
  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!verifyMacroDroid(req, res)) {
    return;
  }
  const args: string[] = [];
  args.push('--experimental-transform-types');
  args.push(process.env.KITTY_SORT_SOLVER_PATH);
  const { input } = req.body as { input: string };
  const unknownFlag = input.includes('-u');
  if (unknownFlag) {
    args.push('-u');
  }
  let fInput = input.replace('-u', '').trim().toLowerCase().split(' ');
  const size = fInput[0];
  fInput.shift();
  if (!size || isNaN(Number(size))) {
    console.error('input must start with size');
    return res.status(400).json({ error: 'Invalid input format' });
  }
  args.push('-a', '-s', size);
  if (fInput[0] === 'm' || fInput[0] === 'meta') {
    fInput.shift();
    const meta = fInput[0];
    fInput.shift();
    args.push('-m', meta);
  }

  if (fInput.length < 16) {
    fInput = fInput.join(' ').replace(/ /g, '').split('');
    for (const [i, char] of fInput.entries()) {
      switch (char) {
        case 'l':
          fInput[i] = 'bl';
          break;
        case 'f':
          fInput[i] = 'br';
          break;
        case 'm':
          fInput[i] = 'pu';
          break;
      }
    }
  }

  args.push('-i', fInput.join(' '));
  spawn('node', args);
  res.status(200).json({ message: 'Kitty sort solver started' });
}
