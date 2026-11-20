import type {
  Action,
  Color,
  GameEvent,
  GameState,
  Piece,
  PieceRef,
  PieceType,
  Trauma,
} from '@/types/remorse';

// Bishop healing trigger. 'bishop-moves': only the bishop's own move heals the
// pieces it lands next to. 'either-moves': a hurt piece landing next to a
// friendly bishop also heals.
export type HealTrigger = 'bishop-moves' | 'either-moves';

export const RULES = {
  healTrigger: 'bishop-moves' as HealTrigger,
  devastatedTurns: 3,
  bloodlustKills: 3,
};

export class RuleError extends Error {}

const FILES = 'abcdefgh';
const BACK_RANK: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

const isSquare = (square: string) => /^[a-h][1-8]$/.test(square);

const coords = (square: string) => [
  FILES.indexOf(square[0]),
  Number(square[1]) - 1,
];

export const isAdjacent = (a: string, b: string) => {
  const [ax, ay] = coords(a);
  const [bx, by] = coords(b);
  return a !== b && Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1;
};

export const opponent = (color: Color): Color => (color === 'w' ? 'b' : 'w');

const newPiece = (
  color: Color,
  type: PieceType,
  square: string,
  id: string,
): Piece => ({
  id,
  color,
  type,
  square,
  trauma: null,
  healed: false,
  turnsLeft: 0,
  devastatedOnTurn: null,
  kills: 0,
});

export const initialState = (): GameState => {
  const pieces: Piece[] = [];
  for (const color of ['w', 'b'] as const) {
    const back = color === 'w' ? '1' : '8';
    const pawns = color === 'w' ? '2' : '7';
    for (const [i, file] of [...FILES].entries()) {
      const type = BACK_RANK[i];
      pieces.push(
        newPiece(color, type, `${file}${back}`, `${color}${type}-${file}`),
      );
      pieces.push(newPiece(color, 'p', `${file}${pawns}`, `${color}p-${file}`));
    }
  }
  return {
    pieces,
    turn: 'w',
    extraMove: false,
    turnNumber: 1,
    winner: null,
    enPassant: null,
  };
};

export const traumaForRoll = (roll: number): Trauma => {
  if (roll === 1) return 'devastated';
  if (roll <= 3) return 'guilt';
  if (roll <= 5) return 'unaffected';
  return 'psychopath';
};

export const canBeHealed = (piece: Piece) =>
  (piece.trauma === 'devastated' || piece.trauma === 'guilt') && !piece.healed;

const ref = (piece: Piece): PieceRef => ({
  id: piece.id,
  color: piece.color,
  type: piece.type,
});

const clone = (state: GameState): GameState => ({
  ...state,
  pieces: state.pieces.map((piece) => ({ ...piece })),
});

const pieceAt = (state: GameState, square: string) =>
  state.pieces.find((piece) => piece.square === square);

const remove = (state: GameState, piece: Piece) => {
  state.pieces = state.pieces.filter((p) => p.id !== piece.id);
};

const checkKing = (state: GameState, removed: Piece, events: GameEvent[]) => {
  if (removed.type !== 'k' || state.winner) return;
  state.winner = opponent(removed.color);
  events.push({ type: 'gameOver', winner: state.winner });
};

const devastate = (state: GameState, piece: Piece) => {
  piece.turnsLeft = RULES.devastatedTurns;
  piece.devastatedOnTurn = state.turnNumber;
};

// The capturing piece's remorse: a roll on its first capture, re-activation
// when healed, a step towards bloodlust for an active psychopath.
const onCapture = (
  state: GameState,
  piece: Piece,
  rollDie: () => number,
  events: GameEvent[],
) => {
  if (!piece.trauma) {
    const roll = rollDie();
    piece.trauma = traumaForRoll(roll);
    events.push({
      type: 'roll',
      piece: ref(piece),
      roll,
      trauma: piece.trauma,
    });
    if (piece.trauma === 'devastated') devastate(state, piece);
    if (piece.trauma === 'psychopath') {
      piece.kills = 1;
      events.push({ type: 'extraMove', color: piece.color });
      return true;
    }
    return false;
  }
  if (piece.healed) {
    piece.healed = false;
    if (piece.trauma === 'devastated') devastate(state, piece);
    events.push({
      type: 'reactivate',
      piece: ref(piece),
      trauma: piece.trauma,
    });
    return false;
  }
  if (piece.trauma === 'psychopath' && piece.kills < RULES.bloodlustKills) {
    piece.kills += 1;
    events.push(
      piece.kills === RULES.bloodlustKills
        ? { type: 'bloodlust', piece: ref(piece) }
        : { type: 'kill', piece: ref(piece), kills: piece.kills },
    );
  }
  return false;
};

const heal = (piece: Piece, healer: Piece, events: GameEvent[]) => {
  piece.healed = true;
  events.push({ type: 'heal', piece: ref(piece), healer: ref(healer) });
};

const healAround = (state: GameState, moved: Piece, events: GameEvent[]) => {
  if (moved.type === 'b') {
    for (const piece of state.pieces) {
      if (
        piece.color === moved.color &&
        piece.id !== moved.id &&
        canBeHealed(piece) &&
        isAdjacent(piece.square, moved.square)
      ) {
        heal(piece, moved, events);
      }
    }
  }
  if (RULES.healTrigger === 'either-moves' && canBeHealed(moved)) {
    const bishop = state.pieces.find(
      (piece) =>
        piece.type === 'b' &&
        piece.color === moved.color &&
        piece.id !== moved.id &&
        isAdjacent(piece.square, moved.square),
    );
    if (bishop) heal(moved, bishop, events);
  }
};

// Devastated pieces of the side whose turn ends lose a turn; at zero they die.
// The turn a piece became devastated doesn't count.
const endTurn = (state: GameState, events: GameEvent[]) => {
  const color = state.turn;
  for (const piece of [...state.pieces]) {
    if (
      piece.color !== color ||
      piece.trauma !== 'devastated' ||
      piece.healed ||
      piece.devastatedOnTurn === state.turnNumber
    ) {
      continue;
    }
    piece.turnsLeft -= 1;
    if (piece.turnsLeft <= 0) {
      remove(state, piece);
      events.push({ type: 'death', piece: ref(piece) });
      checkKing(state, piece, events);
    }
  }
  state.turn = opponent(color);
  state.extraMove = false;
  state.turnNumber += 1;
};

const castleRook = (
  state: GameState,
  king: Piece,
  from: string,
  to: string,
  events: GameEvent[],
) => {
  const rank = king.color === 'w' ? '1' : '8';
  if (king.type !== 'k' || from !== `e${rank}`) return;
  const rookMove =
    to === `g${rank}`
      ? [`h${rank}`, `f${rank}`]
      : to === `c${rank}`
      ? [`a${rank}`, `d${rank}`]
      : null;
  if (!rookMove) return;
  const rook = pieceAt(state, rookMove[0]);
  if (
    !rook ||
    rook.type !== 'r' ||
    rook.color !== king.color ||
    pieceAt(state, rookMove[1])
  ) {
    return;
  }
  rook.square = rookMove[1];
  events.push({
    type: 'castle',
    rook: ref(rook),
    from: rookMove[0],
    to: rookMove[1],
  });
};

// The square a pawn skipped with a double step; only the very next move can
// capture it en passant
const doubleStepTarget = (piece: Piece, from: string, to: string) => {
  const startRank = piece.color === 'w' ? '2' : '7';
  const jumpRank = piece.color === 'w' ? '4' : '5';
  if (
    piece.type !== 'p' ||
    from[0] !== to[0] ||
    from[1] !== startRank ||
    to[1] !== jumpRank
  ) {
    return null;
  }
  return `${from[0]}${piece.color === 'w' ? '3' : '6'}`;
};

// A pawn moving diagonally onto the skipped square takes the pawn that skipped it
const enPassantVictim = (
  state: GameState,
  piece: Piece,
  from: string,
  to: string,
) => {
  if (piece.type !== 'p' || to !== state.enPassant || from[0] === to[0])
    return undefined;
  const victim = pieceAt(state, `${to[0]}${from[1]}`);
  return victim?.type === 'p' && victim.color !== piece.color
    ? victim
    : undefined;
};

const move = (
  state: GameState,
  from: string,
  to: string,
  rollDie: () => number,
  events: GameEvent[],
) => {
  if (!isSquare(from) || !isSquare(to) || from === to) {
    throw new RuleError('Pick two different squares');
  }
  const piece = pieceAt(state, from);
  if (!piece || piece.color !== state.turn) {
    throw new RuleError('Move one of your own pieces');
  }
  const occupant = pieceAt(state, to);
  if (occupant?.color === piece.color) {
    throw new RuleError("You can't capture your own piece");
  }
  const target = occupant ?? enPassantVictim(state, piece, from, to);

  piece.square = to;
  state.enPassant = doubleStepTarget(piece, from, to);
  events.push({ type: 'move', piece: ref(piece), from, to });
  castleRook(state, piece, from, to, events);

  const lastRank = piece.color === 'w' ? '8' : '1';
  if (piece.type === 'p' && to[1] === lastRank) {
    piece.type = 'q';
    events.push({ type: 'promote', piece: ref(piece) });
  }

  let extraMove = false;
  if (target) {
    remove(state, target);
    events.push({ type: 'capture', piece: ref(piece), captured: ref(target) });
    checkKing(state, target, events);
    extraMove = onCapture(state, piece, rollDie, events);
  }

  healAround(state, piece, events);

  if (extraMove && !state.winner) {
    state.extraMove = true;
  } else {
    endTurn(state, events);
  }
};

// A bishop spends its turn healing itself
const selfHeal = (state: GameState, pieceId: string, events: GameEvent[]) => {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.color !== state.turn || piece.type !== 'b') {
    throw new RuleError('Only your own bishop can heal itself');
  }
  if (!canBeHealed(piece)) {
    throw new RuleError('That bishop has nothing to heal');
  }
  heal(piece, piece, events);
  state.enPassant = null;
  endTurn(state, events);
};

// Applies one player action. rollDie is only called for a first capture; the
// server records what it returned so the step can be replayed.
export const applyAction = (
  state: GameState,
  action: Action,
  rollDie: () => number,
): { state: GameState; events: GameEvent[] } => {
  if (state.winner) throw new RuleError('The game is over');
  const next = clone(state);
  const events: GameEvent[] = [];
  if (action.type === 'move') {
    move(next, action.from, action.to, rollDie, events);
  } else {
    selfHeal(next, action.pieceId, events);
  }
  return { state: next, events };
};
