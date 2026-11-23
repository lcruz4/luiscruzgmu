import type {
  Color,
  GameResponse,
  GameStep,
  PieceRef,
  Trauma,
} from '@/types/remorse';
import { typeName } from './describe';
import { RULES } from './moves';

export type PushMessage = { title: string; body: string };

// What the opponent's action did: `undo` and `join` leave no step of theirs
export type OpponentAction = 'undo' | 'join' | 'other';

const AFTERTASTE: Record<Trauma | 'bloodlust', string> = {
  devastated: '... but they feel terrible about it 😢',
  guilt: '... but they feel bad about it 😔',
  unaffected: '... and they felt nothing 😐',
  psychopath: '... and they liked it 😈',
  bloodlust: "... and they'll do it again 🩸",
};

const listOf = (names: string[]) =>
  names.length < 2
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

// The steps of the opponent's turn: everything after your last step
const lastTurn = (steps: GameStep[], color: Color) => {
  const turn: GameStep[] = [];
  for (const step of [...steps].reverse()) {
    if (step.color !== color) break;
    turn.unshift(step);
  }
  return turn;
};

// The capturing piece's state of mind after the turn: from the board, else
// (it has since died) from what its captures set off
const moodOf = (game: GameResponse, turn: GameStep[], piece: PieceRef) => {
  const events = turn.flatMap((step) => step.events);
  const onBoard = game.state.pieces.find((p) => p.id === piece.id);
  if (
    events.some((e) => e.type === 'bloodlust' && e.piece.id === piece.id) ||
    (onBoard?.trauma === 'psychopath' && onBoard.kills >= RULES.bloodlustKills)
  ) {
    return 'bloodlust';
  }
  if (onBoard?.trauma) return onBoard.trauma;
  for (const event of events) {
    if (
      (event.type === 'roll' || event.type === 'reactivate') &&
      event.piece.id === piece.id
    ) {
      return event.trauma;
    }
  }
  return null;
};

const describeTurn = (game: GameResponse, turn: GameStep[]) => {
  const events = turn.flatMap((step) => step.events);
  const captures = events.flatMap((e) => (e.type === 'capture' ? [e] : []));
  if (captures.length) {
    const piece = captures[0].piece;
    const mood = moodOf(game, turn, piece);
    const taken = listOf(captures.map((e) => typeName(e.captured.type)));
    return `Their ${typeName(piece.type)} took your ${taken}${
      mood ? AFTERTASTE[mood] : '.'
    }`;
  }
  const move = events.findLast((e) => e.type === 'move');
  if (move?.type === 'move') {
    return `Their ${typeName(move.piece.type)} moved to ${move.to}.`;
  }
  if (events.some((e) => e.type === 'heal')) return 'Their bishop healed.';
  return null;
};

// The push for the player in `seat` after the other player acted, or null
// when it's still the actor's move
export const pushMessage = (
  game: GameResponse,
  seat: Color,
  actorName: string,
  action: OpponentAction,
): PushMessage | null => {
  const { winner, turn: toMove } = game.state;
  if (!winner && toMove !== seat) return null;
  const turn =
    action === 'other' ? lastTurn(game.steps, seat === 'w' ? 'b' : 'w') : [];
  const what = describeTurn(game, turn);

  if (winner) {
    const result =
      winner === 'draw' ? 'Draw' : winner === seat ? 'You won' : 'You lost';
    const resigned = turn
      .flatMap((step) => step.events)
      .some((e) => e.type === 'gameOver' && e.reason === 'resign');
    return {
      title: `${result} vs ${actorName}`,
      body: resigned ? `${actorName} resigned.` : what ?? 'Game over.',
    };
  }
  const body =
    action === 'join'
      ? `${actorName} joined your game.`
      : action === 'undo'
      ? `${actorName} took back your last move.`
      : what ?? `${actorName} made their move.`;
  return { title: `Your move vs ${actorName}`, body };
};
