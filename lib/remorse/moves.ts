import type { Color, GameState, Piece } from '@/types/remorse';

export const RULES = {
  // Bishop healing trigger. 'bishop-moves': only the bishop's own move heals
  // the pieces it lands next to. 'either-moves': a hurt piece landing next to
  // a friendly bishop also heals.
  healTrigger: 'bishop-moves' as 'bishop-moves' | 'either-moves',
  devastatedTurns: 3,
  bloodlustKills: 3,
};

const FILES = 'abcdefgh';

export const isSquare = (square: string) => /^[a-h][1-8]$/.test(square);

const coords = (square: string) => [
  FILES.indexOf(square[0]),
  Number(square[1]) - 1,
];

const toSquare = (x: number, y: number) =>
  x >= 0 && x < 8 && y >= 0 && y < 8 ? `${FILES[x]}${y + 1}` : null;

export const isAdjacent = (a: string, b: string) => {
  const [ax, ay] = coords(a);
  const [bx, by] = coords(b);
  return a !== b && Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1;
};

export const opponent = (color: Color): Color => (color === 'w' ? 'b' : 'w');

// Devastated or guilt-ridden and not yet healed: can't capture, give check
// or guard a square
export const isHurt = (piece: Piece) =>
  (piece.trauma === 'devastated' || piece.trauma === 'guilt') && !piece.healed;

// Moves only to capture, and may capture its own side
export const inBloodlust = (piece: Piece) =>
  piece.trauma === 'psychopath' && piece.kills >= RULES.bloodlustKills;

export const pieceAt = (state: GameState, square: string) =>
  state.pieces.find((piece) => piece.square === square);

const KNIGHT = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];
const DIAGONALS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const LINES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const ALL = [...DIAGONALS, ...LINES];

// Squares the piece could capture on, ignoring trauma; occupied squares stop a
// slide and are included whoever is on them
const attackedSquares = (state: GameState, piece: Piece) => {
  const [x, y] = coords(piece.square);
  const squares: string[] = [];
  const step = (offsets: number[][]) => {
    for (const [dx, dy] of offsets) {
      const square = toSquare(x + dx, y + dy);
      if (square) squares.push(square);
    }
  };
  const slide = (directions: number[][]) => {
    for (const [dx, dy] of directions) {
      for (let i = 1; ; i++) {
        const square = toSquare(x + dx * i, y + dy * i);
        if (!square) break;
        squares.push(square);
        if (pieceAt(state, square)) break;
      }
    }
  };
  if (piece.type === 'p') {
    const dy = piece.color === 'w' ? 1 : -1;
    step([
      [1, dy],
      [-1, dy],
    ]);
  } else if (piece.type === 'n') step(KNIGHT);
  else if (piece.type === 'k') step(ALL);
  else if (piece.type === 'b') slide(DIAGONALS);
  else if (piece.type === 'r') slide(LINES);
  else slide(ALL);
  return squares;
};

// Hurt pieces neither give check nor guard squares
export const isAttacked = (state: GameState, square: string, by: Color) =>
  state.pieces.some(
    (piece) =>
      piece.color === by &&
      !isHurt(piece) &&
      attackedSquares(state, piece).includes(square),
  );

export const inCheck = (state: GameState, color: Color) => {
  const king = state.pieces.find((p) => p.color === color && p.type === 'k');
  return !!king && isAttacked(state, king.square, opponent(color));
};

const canTake = (piece: Piece, target: Piece) =>
  !isHurt(piece) && (target.color !== piece.color || inBloodlust(piece));

// A pawn moving diagonally onto the skipped square takes the pawn that skipped it
export const enPassantVictim = (
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

// King and rook unmoved, the squares between empty, and the king not passing
// through or landing on a guarded square or castling out of check
const castlingTargets = (state: GameState, king: Piece) => {
  const rank = king.color === 'w' ? '1' : '8';
  if (king.moved || king.square !== `e${rank}` || inBloodlust(king)) return [];
  const enemy = opponent(king.color);
  if (isAttacked(state, king.square, enemy)) return [];
  const sides = [
    { rook: 'h', empty: 'fg', path: 'fg', to: 'g' },
    { rook: 'a', empty: 'bcd', path: 'dc', to: 'c' },
  ];
  const targets: string[] = [];
  for (const side of sides) {
    const rook = pieceAt(state, `${side.rook}${rank}`);
    if (
      rook?.type === 'r' &&
      rook.color === king.color &&
      !rook.moved &&
      [...side.empty].every((file) => !pieceAt(state, `${file}${rank}`)) &&
      [...side.path].every(
        (file) => !isAttacked(state, `${file}${rank}`, enemy),
      )
    ) {
      targets.push(`${side.to}${rank}`);
    }
  }
  return targets;
};

// Where the piece can go before considering its own king's safety
const pseudoMoves = (state: GameState, piece: Piece) => {
  const targets: string[] = [];
  const bloodlust = inBloodlust(piece);
  if (piece.type === 'p') {
    const [x, y] = coords(piece.square);
    const dy = piece.color === 'w' ? 1 : -1;
    const one = toSquare(x, y + dy);
    if (!bloodlust && one && !pieceAt(state, one)) {
      targets.push(one);
      const two = toSquare(x, y + 2 * dy);
      const startRank = piece.color === 'w' ? 1 : 6;
      if (y === startRank && two && !pieceAt(state, two)) targets.push(two);
    }
  }
  for (const square of attackedSquares(state, piece)) {
    const target =
      pieceAt(state, square) ??
      enPassantVictim(state, piece, piece.square, square);
    if (target) {
      if (canTake(piece, target)) targets.push(square);
    } else if (piece.type !== 'p' && !bloodlust) {
      targets.push(square);
    }
  }
  if (piece.type === 'k') targets.push(...castlingTargets(state, piece));
  return targets;
};

// Only where the pieces stand, for testing king safety
const boardAfter = (state: GameState, piece: Piece, to: string): GameState => {
  const victim =
    pieceAt(state, to) ?? enPassantVictim(state, piece, piece.square, to);
  const rank = piece.square[1];
  const castle =
    piece.type === 'k' && piece.square[0] === 'e'
      ? to === `g${rank}`
        ? [`h${rank}`, `f${rank}`]
        : to === `c${rank}`
        ? [`a${rank}`, `d${rank}`]
        : null
      : null;
  return {
    ...state,
    pieces: state.pieces
      .filter((p) => p !== victim)
      .map((p) =>
        p === piece
          ? { ...p, square: to }
          : castle && p.square === castle[0]
          ? { ...p, square: castle[1] }
          : p,
      ),
  };
};

// Moves for the piece on `from` that don't leave its own king in check.
// Taking a king (the enemy's, or your own in bloodlust) ends the game, so it's
// always allowed.
export const legalMoves = (state: GameState, from: string) => {
  const piece = pieceAt(state, from);
  if (!piece || state.winner) return [];
  return pseudoMoves(state, piece).filter(
    (to) =>
      pieceAt(state, to)?.type === 'k' ||
      !inCheck(boardAfter(state, piece, to), piece.color),
  );
};

// A move or, out of check, a bishop healing itself
export const hasLegalAction = (state: GameState, color: Color) => {
  const own = state.pieces.filter((piece) => piece.color === color);
  return (
    own.some((piece) => legalMoves(state, piece.square).length > 0) ||
    (!inCheck(state, color) &&
      own.some((piece) => piece.type === 'b' && isHurt(piece)))
  );
};
