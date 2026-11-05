import type { NextApiHandler } from 'next';
import { Resend } from 'resend';
import { logger } from '@/services/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && EMAIL_REGEX.test(value);

// Resend templates insert {{{VARIABLES}}} unescaped
export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// From and subject are set on the Resend template
export const sendEmail = async (options: {
  to: string;
  replyTo: string;
  template: { id: string; variables: Record<string, string> };
}) => {
  const { error } = await resend.emails.send(options);
  if (error) {
    logger.error('Resend send failed', error);
    throw new Error(error.message);
  }
};

// POST-only JSON route; `build` returns the email to send or an error message for a 400
export const emailRoute =
  (
    build: (
      body: Record<string, unknown>,
    ) => Parameters<typeof sendEmail>[0] | string,
  ): NextApiHandler =>
  async (req, res) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({ success: false, error: 'please use POST' });
      return;
    }

    let body: unknown = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }
    if (typeof body !== 'object' || body === null) {
      res.status(400).json({ success: false, error: 'invalid body' });
      return;
    }

    const email = build({ ...body });
    if (typeof email === 'string') {
      res.status(400).json({ success: false, error: email });
      return;
    }

    try {
      await sendEmail(email);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'failed to send email' });
    }
  };
