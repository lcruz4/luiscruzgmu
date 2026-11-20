import type { Color, GameEvent, PieceRef, PieceType } from '@/types/remorse';

const NAMES: Record<PieceType, string> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

export const colorName = (color: Color) => (color === 'w' ? 'White' : 'Black');

const name = (piece: PieceRef) =>
  `${colorName(piece.color)} ${NAMES[piece.type]}`;

const TRAUMA_TEXT = {
  devastated: 'devastated',
  guilt: 'guilt-ridden',
  unaffected: 'unaffected',
  psychopath: 'a psychopath',
};

// One log line per event
export const describeEvent = (event: GameEvent): string => {
  switch (event.type) {
    case 'move':
      return `${name(event.piece)} ${event.from} → ${event.to}`;
    case 'castle':
      return `Castled: rook ${event.from} → ${event.to}`;
    case 'promote':
      return `${colorName(event.piece.color)} pawn promoted to a ${
        NAMES[event.piece.type]
      }`;
    case 'capture':
      return `${name(event.piece)} captured the ${NAMES[event.captured.type]}`;
    case 'roll':
      return `Rolled ${event.roll}: ${name(event.piece)} is ${
        TRAUMA_TEXT[event.trauma]
      }`;
    case 'reactivate':
      return `${name(event.piece)} is ${TRAUMA_TEXT[event.trauma]} again`;
    case 'kill':
      return `${name(event.piece)}: psychopath ${event.kills}/3`;
    case 'bloodlust':
      return `${name(event.piece)} is in bloodlust`;
    case 'extraMove':
      return `${name(event.piece)} gets an extra move`;
    case 'skipExtraMove':
      return `${name(event.piece)} skipped its extra move`;
    case 'heal':
      return event.piece.id === event.healer.id
        ? `${name(event.piece)} healed itself`
        : `${name(event.healer)} healed the ${NAMES[event.piece.type]}`;
    case 'death':
      return `${name(event.piece)} died of grief`;
    case 'gameOver':
      return `${colorName(event.winner)} wins`;
  }
};
