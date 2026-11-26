import { sendNotification, setVapidDetails, WebPushError } from 'web-push';
import {
  type OpponentAction,
  pushMessage,
  timeoutMessage,
} from '@/lib/remorse/notify';
import type { GameResponse } from '@/types/remorse';
import { logger } from './logger';
import { listGames, remorsePool } from './remorseDb';

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

// Tells a player someone followed them. mutual: they already follow back,
// so they can challenge each other now
export const notifyFollow = async (
  recipient: string,
  follower: { id: number | null; name: string },
  mutual: boolean,
) => {
  if (!publicKey || !privateKey) return;
  await sendToEmail(recipient, {
    title: `${follower.name} followed you`,
    body: mutual
      ? 'You follow each other now, so you can challenge them.'
      : 'Follow back so you can challenge each other.',
    tag: `remorse-follow-${follower.id}`,
    url: follower.id
      ? `/projects/remorse-chess/players/${follower.id}`
      : '/projects/remorse-chess',
  });
};

// Tells a challenged player who's waiting on them
export const notifyChallenge = async (
  game: GameResponse,
  recipient: string,
) => {
  if (!publicKey || !privateKey) return;
  const challenger = game.whiteName ?? game.blackName ?? 'Someone';
  await sendToEmail(recipient, {
    title: `${challenger} challenged you`,
    body: 'Accept to start the game.',
    tag: `remorse-${game.id}`,
    url: `/projects/remorse-chess/${game.id}`,
  });
};

// After `actor` acted on an online game: tells the other player when it's now
// their move or the game just ended
export const notifyOpponent = async (
  game: GameResponse,
  actor: string,
  action: OpponentAction,
) => {
  if (!publicKey || !privateKey || game.mode !== 'online') return;
  if (!game.whiteEmail || !game.blackEmail) return;
  const actorIsWhite = game.whiteEmail === actor;
  const recipient = actorIsWhite ? game.blackEmail : game.whiteEmail;
  const actorName = (actorIsWhite ? game.whiteName : game.blackName) ?? 'them';
  const message = pushMessage(
    game,
    actorIsWhite ? 'b' : 'w',
    actorName,
    action,
  );
  if (!message) return;

  const games = await listGames(recipient);
  await sendToEmail(recipient, {
    ...message,
    tag: `remorse-${game.id}`,
    url: `/projects/remorse-chess/${game.id}`,
    badge: games.filter((g) => g.yourMove).length,
  });
};

// Both players of an online game that just ended on time
export const notifyTimeout = async (game: GameResponse) => {
  if (!publicKey || !privateKey || game.mode !== 'online') return;
  const { winner } = game.state;
  if (!game.whiteEmail || !game.blackEmail || !winner || winner === 'draw') {
    return;
  }
  const loserEmail = winner === 'w' ? game.blackEmail : game.whiteEmail;
  const winnerName =
    (winner === 'w' ? game.whiteName : game.blackName) ?? 'them';
  await Promise.all([
    notifyOpponent(game, loserEmail, 'other'),
    sendToEmail(loserEmail, {
      ...timeoutMessage(winnerName),
      tag: `remorse-${game.id}`,
      url: `/projects/remorse-chess/${game.id}`,
    }),
  ]);
};
