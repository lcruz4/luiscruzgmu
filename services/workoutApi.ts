import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseError } from 'pg';
import { getAuthenticatedEmail, getAuthenticatedRoles } from './auth';
import { logger } from './logger';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const UNIQUE_VIOLATION = '23505';
const FK_VIOLATION = '23503';

type MethodHandler = (req: NextApiRequest, email: string) => Promise<unknown>;

// Method check → auth check (returns the email or throws an HttpError) →
// handler. The handler's return value is sent as 200 JSON; HttpError → its
// status; unique/foreign key violations → 409; anything else → logged 500.
const route =
  (authenticate: (req: NextApiRequest) => Promise<string>) =>
  (handlers: Partial<Record<string, MethodHandler>>) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const handler = req.method ? handlers[req.method] : undefined;
    if (!handler) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const email = await authenticate(req);
      return res.status(200).json(await handler(req, email));
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }
      if (
        error instanceof DatabaseError &&
        (error.code === UNIQUE_VIOLATION || error.code === FK_VIOLATION)
      ) {
        return res.status(409).json({ error: error.detail ?? error.message });
      }
      logger.error(`${req.method} ${req.url} failed:`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

export const workoutRoute = route(async (req) => {
  const email = await getAuthenticatedEmail(req, 'workout-tracker');
  if (!email) throw new HttpError(401, 'Unauthorized');
  return email;
});

// Needs the admin role for workout-tracker
export const workoutAdminRoute = route(async (req) => {
  const auth = await getAuthenticatedRoles(req, 'workout-tracker');
  if (!auth) throw new HttpError(401, 'Unauthorized');
  if (!auth.roles.includes('admin')) throw new HttpError(403, 'Forbidden');
  return auth.email;
});

const badRequest = (message: string) => new HttpError(400, message);

const INT_MAX = 2147483647;

export const objectField = (
  value: unknown,
  name: string,
): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw badRequest(`${name} must be an object`);
  }
  return Object.fromEntries(Object.entries(value));
};

export const bodyOf = (req: NextApiRequest) => objectField(req.body, 'body');

// Accepts a JSON number or a numeric query string
export const intField = (
  value: unknown,
  name: string,
  min: number,
  max: number,
): number => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${name} must be an integer from ${min} to ${max}`);
  }
  return n;
};

export const idField = (value: unknown, name: string) =>
  intField(value, name, 1, INT_MAX);

export const nullableIntField = (
  value: unknown,
  name: string,
  min: number,
  max: number,
) => (value === null ? null : intField(value, name, min, max));

export const nullableBooleanField = (
  value: unknown,
  name: string,
): boolean | null => {
  if (value !== null && typeof value !== 'boolean') {
    throw badRequest(`${name} must be true, false or null`);
  }
  return value;
};

// Required key; null or blank → null
export const textField = (
  value: unknown,
  name: string,
  maxLength: number,
): string | null => {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw badRequest(
      `${name} must be text up to ${maxLength} characters, or null`,
    );
  }
  return value.trim() || null;
};

export const dateField = (value: unknown, name = 'date'): string => {
  const valid =
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().startsWith(value);
  if (!valid) {
    throw badRequest(`${name} must be a YYYY-MM-DD date`);
  }
  return value;
};
