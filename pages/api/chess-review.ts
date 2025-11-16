import { NextApiHandler } from 'next';
import { stockfishService } from '../../services/stockfish';


const handler: NextApiHandler = async (req, res) => {
  const { pgn } = req.query;

  if (!pgn || Array.isArray(pgn)) {
    res.status(400).json({ success: false, error: 'please provide a valid pgn query parameter' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'please use GET' });
    return;
  }

  const analysis = await stockfishService.analyzeGame(pgn);
  res.status(200).json({ success: true, analysis });
};

export default handler;
