import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt: input } = req.body;
  const remembering = input.toLowerCase().replace('remember that', '').trim();

  try {
    const resp = `i'll remember that you told me ${remembering}`;

    res.status(200).json(resp);
  } catch (error) {
    console.error('error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
