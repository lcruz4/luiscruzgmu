import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedEmail } from '@/services/auth';
import { getGiantList, KeepApiError } from '@/services/keep';
import { logger } from '@/services/logger';

// The unchecked items of the Keep "Giant" list, to fill the list textarea
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await getAuthenticatedEmail(req, 'giant-order-tool'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { items } = await getGiantList();
    return res.status(200).json({ items: items.map((item) => item.text) });
  } catch (error) {
    logger.error('Pulling the Keep list failed:', error);
    if (error instanceof KeepApiError && error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(503).json({
      error:
        error instanceof KeepApiError ? error.message : 'Couldn’t reach Keep',
    });
  }
};

export default handler;
