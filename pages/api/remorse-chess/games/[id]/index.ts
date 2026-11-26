import type { NextApiRequest } from 'next';
import {
  bodyOf,
  HttpError,
  idField,
  intField,
  NO_CONTENT,
} from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import {
  cancelGame,
  gameVersion,
  getGame,
  joinGame,
  playAction,
  resignGame,
  setArchived,
  setBalanceOdds,
} from '@/services/remorseDb';
import { isValidPercents } from '@/lib/remorse/balance';
import { isLive } from '@/lib/remorse/timeControls';
import { logger } from '@/services/logger';
import { announceAbort, expireGames } from '@/services/remorseClock';
import {
  notifyAborted,
  notifyOpponent,
  notifyTimeout,
} from '@/services/remorsePush';
import { publishGameChange } from '@/services/remorseLive';

const squareField = (value: unknown, name: string) => {
  if (typeof value !== 'string' || !/^[a-h][1-8]$/.test(value)) {
    throw new HttpError(400, `${name} must be a square like e4`);
  }
  return value;
};

const promotionField = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (value === 'q' || value === 'r' || value === 'b' || value === 'n')
    return value;
  throw new HttpError(400, "promotion must be 'q', 'r', 'b' or 'n'");
};

// Body: { type, version, ... }
//   move: { from, to, promotion? } · bishopHeal: { pieceId } · skipExtraMove · resign
//   join: { inviteToken } from the invite link, or nothing to accept a challenge
//   flag: the side to move's clock ran out; anyone watching may claim it
//   archive / unarchive: hide the game from your lobby or bring it back
//   setOdds: { odds: { w, b } }, each { devastated, guilt, unaffected,
//     psychopath } in whole percents adding up to 100
const postAction = async (req: NextApiRequest, email: string) => {
  const id = idField(req.query.id, 'id');
  const body = bodyOf(req);
  const version = () => intField(body.version, 'version', 0, 2147483647);
  let timedOut: Awaited<ReturnType<typeof playAction>>['timedOut'] = null;

  if (body.type === 'flag') {
    await expireGames({ id });
    return getGame(id, email);
  } else if (body.type === 'move') {
    ({ timedOut } = await playAction(id, email, version(), {
      type: 'move',
      from: squareField(body.from, 'from'),
      to: squareField(body.to, 'to'),
      promotion: promotionField(body.promotion),
    }));
  } else if (body.type === 'bishopHeal') {
    if (typeof body.pieceId !== 'string') {
      throw new HttpError(400, 'pieceId must be text');
    }
    ({ timedOut } = await playAction(id, email, version(), {
      type: 'bishopHeal',
      pieceId: body.pieceId,
    }));
  } else if (body.type === 'skipExtraMove') {
    ({ timedOut } = await playAction(id, email, version(), {
      type: 'skipExtraMove',
    }));
  } else if (body.type === 'resign') {
    await resignGame(id, email, version());
  } else if (body.type === 'join') {
    if (
      body.inviteToken !== undefined &&
      typeof body.inviteToken !== 'string'
    ) {
      throw new HttpError(400, 'inviteToken must be text');
    }
    await joinGame(id, email, body.inviteToken);
  } else if (body.type === 'setOdds') {
    const odds: unknown = body.odds;
    const side = (color: 'w' | 'b') => {
      const percents =
        typeof odds === 'object' && odds !== null
          ? Reflect.get(odds, color)
          : undefined;
      if (!isValidPercents(percents)) {
        throw new HttpError(
          400,
          `odds.${color} must be whole percents adding up to 100`,
        );
      }
      return percents;
    };
    await setBalanceOdds(id, email, version(), { w: side('w'), b: side('b') });
    const game = await getGame(id, email);
    publishGameChange(id, game.version);
    return game;
  } else if (body.type === 'archive' || body.type === 'unarchive') {
    await setArchived(id, email, body.type === 'archive');
    return getGame(id, email);
  } else {
    throw new HttpError(
      400,
      "type must be 'move', 'bishopHeal', 'skipExtraMove', 'resign', 'join', 'setOdds', 'flag', 'archive' or 'unarchive'",
    );
  }
  if (timedOut?.kind === 'aborted') {
    announceAbort(timedOut);
    throw new HttpError(404, 'Game not found');
  }
  const game = await getGame(id, email);
  publishGameChange(id, game.version);
  // Not awaited: the mover shouldn't wait on push services
  const push = timedOut
    ? notifyTimeout(game)
    : notifyOpponent(game, email, body.type === 'join' ? 'join' : 'other');
  push.catch((error) => logger.error('Remorse notify failed:', error));
  return game;
};

// ?since=<version the client has>: 204 while that's still current, so a poll
// that finds nothing new skips loading and sending the whole game
const getAction = async (req: NextApiRequest, email: string) => {
  const id = idField(req.query.id, 'id');
  await expireGames({ id });
  if (req.query.since !== undefined) {
    const since = intField(req.query.since, 'since', 0, 2147483647);
    if ((await gameVersion(id)) === since) return NO_CONTENT;
  }
  return getGame(id, email);
};

// Cancels an online game nobody has joined yet, or aborts one you haven't
// moved in
const deleteGame = async (req: NextApiRequest, email: string) => {
  const id = idField(req.query.id, 'id');
  const game = await getGame(id, email);
  const { abortedFor } = await cancelGame(id, email);
  publishGameChange(id, 'deleted');
  if (abortedFor && !isLive(game.timeControl)) {
    const name = game.whiteEmail === email ? game.whiteName : game.blackName;
    notifyAborted(abortedFor, name ?? 'Your opponent').catch((error) =>
      logger.error('Remorse notify failed:', error),
    );
  }
  return NO_CONTENT;
};

export default remorseRoute({
  GET: getAction,
  POST: postAction,
  DELETE: deleteGame,
});
