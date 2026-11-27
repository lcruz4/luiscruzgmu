import { randomInt } from 'node:crypto';
import type { NextApiRequest } from 'next';
import { bodyOf, HttpError, idField } from '@/services/api';
import { logger } from '@/services/logger';
import { remorseRoute } from '@/services/remorseApi';
import {
  createGame,
  createChallenge,
  createRematch,
  findMatch,
  getGame,
  listGames,
} from '@/services/remorseDb';
import { expireGames } from '@/services/remorseClock';
import { publishGameChange } from '@/services/remorseLive';
import { notifyChallenge, notifyOpponent } from '@/services/remorsePush';
import {
  DEFAULT_TIME_CONTROL,
  isLive,
  isTimeControl,
} from '@/lib/remorse/timeControls';
import { assertNotDeploying } from '@/services/deployStatus';
import type { Color } from '@/types/remorse';

// Seats the player against the next one looking, or leaves them waiting.
// A match tells the waiting player right away.
const playRandom = async (email: string, timeControl: string) => {
  const { id, color, matched, canceled } = await findMatch(email, timeControl);
  for (const other of canceled) publishGameChange(other, 'deleted');
  if (matched) {
    const game = await getGame(id, email);
    publishGameChange(id, game.version);
    notifyOpponent(game, email, 'join').catch((error) =>
      logger.error('Remorse notify failed:', error),
    );
  }
  return { id, color };
};

// Holds the other seat for the player; they get a push the first time.
// Challenging someone who already challenged you accepts theirs.
const challenge = async (
  email: string,
  playerId: number,
  balanced: boolean,
  timeControl: string,
) => {
  const { id, color, opponentEmail, created, accepted } = await createChallenge(
    email,
    playerId,
    balanced,
    timeControl,
  );
  if (created || accepted) {
    const game = await getGame(id, email);
    if (accepted) publishGameChange(id, game.version);
    const push = accepted
      ? notifyOpponent(game, email, 'join')
      : notifyChallenge(game, opponentEmail);
    push.catch((error) => logger.error('Remorse notify failed:', error));
  }
  return { id, color };
};

const balancedField = (value: unknown) => {
  if (value === undefined || typeof value === 'boolean') return value;
  throw new HttpError(400, 'balanced must be true or false');
};

// Older clients send no time control. No new live game during a deploy, not
// even one left waiting for an opponent.
const timeControlField = async (value: unknown) => {
  const timeControl = value === undefined ? DEFAULT_TIME_CONTROL : value;
  if (!isTimeControl(timeControl)) {
    throw new HttpError(400, 'timeControl must be one of TIME_CONTROLS');
  }
  if (isLive(timeControl)) await assertNotDeploying();
  return timeControl;
};

// Body: { mode: 'online' | 'local' | 'random' }, { rematchOf: <finished game id> }
// or { challenge: <player id> }, with a `timeControl` id except for a rematch,
// which keeps its game's. `balanced: true` makes an online, local or
// challenge game balanced; a rematch is balanced like its game unless
// `balanced` says otherwise. Random games never are.
// Online, the creator's seat is random (swapped for a rematch) and returned
// as `color`, with the invite link's `inviteToken`.
const postGame = async (req: NextApiRequest, email: string) => {
  const body = bodyOf(req);
  const balanced = balancedField(body.balanced);
  if (body.rematchOf !== undefined) {
    return createRematch(idField(body.rematchOf, 'rematchOf'), email, balanced);
  }
  if (body.challenge !== undefined) {
    return challenge(
      email,
      idField(body.challenge, 'challenge'),
      balanced ?? false,
      await timeControlField(body.timeControl),
    );
  }
  const timeControl = await timeControlField(body.timeControl);
  if (body.mode === 'random') return playRandom(email, timeControl);
  if (body.mode !== 'online' && body.mode !== 'local') {
    throw new HttpError(400, "mode must be 'online', 'local' or 'random'");
  }
  const color: Color = randomInt(2) ? 'b' : 'w';
  return createGame(email, body.mode, color, balanced ?? false, timeControl);
};

export default remorseRoute({
  GET: async (_req, email) => {
    await expireGames({ email });
    return listGames(email);
  },
  POST: postGame,
});
