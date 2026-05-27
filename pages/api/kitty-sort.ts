import { kittySortSolver } from '@/lib/kittySort';
import { verifyMacroDroid } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

const FLAGS = [
  '-t',
  '--try',
  '--debug',
  '-u',
  '--uncover',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!verifyMacroDroid(req, res)) {
    return;
  }
  const args: string[] = [];
  const { input } = req.body as { input: string };
  let _input = input.trim().toLowerCase();
  for (const flag of FLAGS) {
    const flagPresent = _input.includes(flag);
    if (flagPresent) {
      args.push(flag);
    }
    _input = _input.replace(flag, '');
  }
  let fInput = _input.split(' ');
  const size = fInput[0];
  fInput.shift();
  if (!size || isNaN(Number(size))) {
    console.error('input must start with size');
    return res.status(400).json({ error: 'Invalid input format' });
  }
  args.push('-s', size);
  if (fInput[0] === 'm' || fInput[0] === 'meta') {
    fInput.shift();
    const meta = fInput[0];
    fInput.shift();
    args.push('-m', meta);
  }

  if (fInput.length < 25) {
    fInput = fInput.join(' ').replace(/ /g, '').split('');
  }

  args.push('-i', fInput.join(' '));
  const response = kittySortSolver(args);
  res.status(200).json(response);
}
