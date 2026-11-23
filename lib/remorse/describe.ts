import type {
  Color,
  GameEvent,
  GameSummary,
  PieceRef,
  PieceType,
} from '@/types/remorse';
import { opponent } from './moves';

const NAMES: Record<PieceType, string> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

export const colorName = (color: Color) => (color === 'w' ? 'White' : 'Black');

// Who won, for a finished game
export const resultText = (winner: Color | 'draw') =>
  winner === 'draw' ? 'Draw' : `${colorName(winner)} wins`;

export const typeName = (type: PieceType) => NAMES[type];

export const pieceName = (piece: Pick<PieceRef, 'color' | 'type'>) =>
  `${colorName(piece.color)} ${NAMES[piece.type]}`;

export const TRAUMA_TEXT = {
  devastated: 'devastated',
  guilt: 'guilt-ridden',
  unaffected: 'unaffected',
  psychopath: 'a psychopath',
};

// One log line per event
export const describeEvent = (event: GameEvent): string => {
  switch (event.type) {
    case 'move':
      return `${pieceName(event.piece)} ${event.from} → ${event.to}`;
    case 'castle':
      return `Castled: rook ${event.from} → ${event.to}`;
    case 'promote':
      return `${colorName(event.piece.color)} pawn promoted to a ${
        NAMES[event.piece.type]
      }`;
    case 'capture':
      return `${pieceName(event.piece)} captured the ${
        NAMES[event.captured.type]
      }`;
    case 'roll':
      return `Rolled ${event.roll}: ${pieceName(event.piece)} is ${
        TRAUMA_TEXT[event.trauma]
      }`;
    case 'reactivate':
      return `${pieceName(event.piece)} is ${TRAUMA_TEXT[event.trauma]} again`;
    case 'kill':
      return `${pieceName(event.piece)}: psychopath ${event.kills}/3`;
    case 'bloodlust':
      return `${pieceName(event.piece)} is in bloodlust`;
    case 'extraMove':
      return `${pieceName(event.piece)} gets an extra move`;
    case 'skipExtraMove':
      return `${pieceName(event.piece)} skipped its extra move`;
    case 'heal':
      return event.piece.id === event.healer.id
        ? `${pieceName(event.piece)} healed itself`
        : `${pieceName(event.healer)} healed the ${NAMES[event.piece.type]}`;
    case 'death':
      return `${pieceName(event.piece)} died of grief`;
    case 'check':
      return `${colorName(event.color)} is in check`;
    case 'gameOver':
      return event.reason === 'checkmate'
        ? `Checkmate. ${resultText(event.winner)}`
        : event.reason === 'stalemate'
        ? 'Stalemate. Draw'
        : event.reason === 'resign' && event.winner !== 'draw'
        ? `${colorName(opponent(event.winner))} resigned. ${resultText(
            event.winner,
          )}`
        : resultText(event.winner);
  }
};

// An online game with both seats taken, not over, waiting on this email.
// Matches yourMoveCount in services/remorsePush.ts.
export const isYourMove = (game: GameSummary, email: string) =>
  game.mode === 'online' &&
  !game.winner &&
  !!game.whiteEmail &&
  !!game.blackEmail &&
  (game.turn === 'w' ? game.whiteEmail : game.blackEmail) === email;
