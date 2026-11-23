import { sendNotification, setVapidDetails, WebPushError } from 'web-push';
import type { GameResponse } from '@/types/remorse';
import { logger } from './logger';
import { remorsePool } from './remorseDb';

const publicKey = process.env.REMORSE_VAPID_PUBLIC_KEY;
const privateKey = process.env.REMORSE_VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  setVapidDetails('https://lcruz.dev', publicKey, privateKey);
}

export const vapidPublicKey = () => publicKey ?? null;

export const savePushSubscription = async (
  email: string,
  endpoint: string,
  p256dh: string,
  auth: string,
) => {
  await remorsePool.query(
    `INSERT INTO push_subscriptions (endpoint, email, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
     SET email = $2, p256dh = $3, auth = $4`,
    [endpoint, email, p256dh, auth],
  );
};

export const deletePushSubscription = async (
  email: string,
  endpoint: string,
) => {
  await remorsePool.query(
    `DELETE FROM push_subscriptions
     WHERE endpoint = $1 AND email = $2`,
    [endpoint, email],
  );
};

// Online games with both seats taken, not over, where it's this email's turn.
// Matches isYourMove in lib/remorse/describe.ts.
const yourMoveCount = async (email: string) => {
  const { rows } = await remorsePool.query<{ count: number }>(
    `SELECT count(*)::int AS count
     FROM games
     WHERE mode = 'online'
       AND white_email IS NOT NULL
       AND black_email IS NOT NULL
       AND state->>'winner' IS NULL
       AND CASE state->>'turn' WHEN 'w' THEN white_email ELSE black_email END = $1`,
    [email],
  );
  return rows[0]?.count ?? 0;
};

const sendToEmail = async (email: string, payload: object) => {
  const { rows } = await remorsePool.query<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>(
    `SELECT endpoint, p256dh, auth
     FROM push_subscriptions
     WHERE email = $1`,
    [email],
  );
  const body = JSON.stringify(payload);
  await Promise.all(
    rows.map(async ({ endpoint, p256dh, auth }) => {
      try {
        await sendNotification({ endpoint, keys: { p256dh, auth } }, body, {
          TTL: 60 * 60 * 24,
          urgency: 'high',
        });
      } catch (error) {
        // Gone: the browser dropped the subscription
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          await remorsePool.query(
            `DELETE FROM push_subscriptions
             WHERE endpoint = $1`,
            [endpoint],
          );
          return;
        }
        logger.error('Remorse push failed:', error);
      }
    }),
  );
};

// After `actor` acted on an online game: tells the other player when it's now
// their move or the game just ended
export const notifyOpponent = async (game: GameResponse, actor: string) => {
  if (!publicKey || !privateKey || game.mode !== 'online') return;
  if (!game.whiteEmail || !game.blackEmail) return;
  const actorIsWhite = game.whiteEmail === actor;
  const recipient = actorIsWhite ? game.blackEmail : game.whiteEmail;
  const actorName = (actorIsWhite ? game.whiteName : game.blackName) ?? 'them';
  const seat = actorIsWhite ? 'b' : 'w';
  const { winner, turn } = game.state;

  let body: string;
  if (winner) {
    const result =
      winner === 'draw' ? 'Draw' : winner === seat ? 'You won' : 'You lost';
    body = `${result} vs ${actorName}`;
  } else if (turn === seat) {
    body = `Your move vs ${actorName}`;
  } else {
    return;
  }

  await sendToEmail(recipient, {
    title: 'Remorse Chess',
    body,
    tag: `remorse-${game.id}`,
    url: `/projects/remorse-chess/${game.id}`,
    badge: await yourMoveCount(recipient),
  });
};
