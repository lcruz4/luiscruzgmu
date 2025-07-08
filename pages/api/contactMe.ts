import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  const { name, email, message } = JSON.parse(req.body);

  if (!name || !email || !message) {
    res.status(400).json({ success: false, error: 'please provide name, email, and message' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'please use POST' });
    return;
  }


  const url  = 'https://formspree.io/f/myzwzazz';

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      email,
      message,
      _subject: `Contacted by: ${name} - ${email}`,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    res.status(500).json({ success: false, error: `Form submission failed: ${errorText}` });
    return;
  }
  res.status(200).json({ success: true, message: 'Form submitted successfully!' });
};

export default handler;
