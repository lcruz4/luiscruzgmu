import { NextApiRequest, NextApiResponse } from 'next';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const verifyMacroDroid = (req: NextApiRequest, res: NextApiResponse) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  const base64 = authHeader.slice(6); // strip "Basic "
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');

  if (username !== process.env.MACRODROID_USERNAME || password !== process.env.MACRODROID_PASSWORD) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
};
