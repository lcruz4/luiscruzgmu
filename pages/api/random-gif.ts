import { NextApiRequest, NextApiResponse } from 'next';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
  const {
    query: { tag, rating },
  } = req;

  if (!tag) {
    return res.status(400).json({ error: 'Tag is required' });
  }

  const response = await fetch(
    `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${tag}&rating=${rating}`,
  );
  const data = await response.json();
  const gifUrl = data.data.images.original.url;

  res.status(302).setHeader('Location', gifUrl).end();
}
