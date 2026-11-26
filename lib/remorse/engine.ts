import type {
  Action,
  Color,
  GameEvent,
  GameState,
  MoveAction,
  Piece,
  PieceRef,
  PieceType,
  Trauma,
} from '@/types/remorse';
import {
  bishopHealTargets,
  enPassantVictim,
  hasLegalAction,
  inCheck,
  isAdjacent,
  isHurt,
  isSquare,
  legalMoves,
  opponent,
  pieceAt,
  RULES,
} from './moves';

export {
  bishopHealTargets,
  isAdjacent,
  legalMoves,
  premoveTargets,
  inCheck,
  opponent,
  RULES,
} from './moves';

export class RuleError extends Error {}

const FILES = 'abcdefgh';
const BACK_RANK: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

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
  moved: false,
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
    extraMovePieceId: null,
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

export const canBeHealed = isHurt;

const ref = (piece: Piece): PieceRef => ({
  id: piece.id,
  color: piece.color,
  type: piece.type,
});

const clone = (state: GameState): GameState => ({
  ...state,
  pieces: state.pieces.map((piece) => ({ ...piece })),
});

const remove = (state: GameState, piece: Piece) => {
  state.pieces = state.pieces.filter((p) => p.id !== piece.id);
};

const checkKing = (state: GameState, removed: Piece, events: GameEvent[]) => {
  if (removed.type !== 'k' || state.winner) return;
  state.winner = opponent(removed.color);
  events.push({ type: 'gameOver', winner: state.winner, reason: 'king' });
};

// The side to move with nothing legal is checkmated, or stalemated (a draw)
const checkMate = (state: GameState, events: GameEvent[]) => {
  const color = state.turn;
  const check = inCheck(state, color);
  if (hasLegalAction(state, color)) {
    if (check) events.push({ type: 'check', color });
    return;
  }
  state.winner = check ? opponent(color) : 'draw';
  events.push({
    type: 'gameOver',
    winner: state.winner,
    reason: check ? 'checkmate' : 'stalemate',
  });
};

const devastate = (state: GameState, piece: Piece) => {
  piece.turnsLeft = RULES.devastatedTurns;
  piece.devastatedOnTurn = state.turnNumber;
};

// The capturing piece's remorse: a roll on its first capture, re-activation
// when healed, a step towards bloodlust for an active psychopath. Returns
// whether the piece is a psychopath, which earns an extra move.
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
  return piece.trauma === 'psychopath';
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
  state.extraMovePieceId = null;
  state.turnNumber += 1;
  if (!state.winner) checkMate(state, events);
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
  rook.moved = true;
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

const move = (
  state: GameState,
  { from, to, promotion }: MoveAction,
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
  if (state.extraMovePieceId && piece.id !== state.extraMovePieceId) {
    throw new RuleError('Only the psychopath gets the extra move');
  }
  if (!legalMoves(state, from).includes(to)) {
    throw new RuleError(
      pieceAt(state, to)?.color === piece.color
        ? "You can't capture your own piece"
        : "That piece can't move there",
    );
  }
  const target = pieceAt(state, to) ?? enPassantVictim(state, piece, from, to);
  const promotes =
    piece.type === 'p' && to[1] === (piece.color === 'w' ? '8' : '1');
  if (promotes && !promotion) {
    throw new RuleError('Choose a piece to promote to');
  }

  piece.square = to;
  piece.moved = true;
  state.enPassant = doubleStepTarget(piece, from, to);
  events.push({ type: 'move', piece: ref(piece), from, to });
  castleRook(state, piece, from, to, events);

  if (promotes && promotion) {
    piece.type = promotion;
    events.push({ type: 'promote', piece: ref(piece) });
  }

  // A capture made with the extra move doesn't earn another one
  const onExtraMove = state.extraMovePieceId !== null;
  let extraMove = false;
  if (target) {
    remove(state, target);
    events.push({ type: 'capture', piece: ref(piece), captured: ref(target) });
    checkKing(state, target, events);
    // Taking the king ends the game on the spot: no roll, healing or deaths
    if (state.winner) return;
    extraMove = onCapture(state, piece, rollDie, events) && !onExtraMove;
  }

  healAround(state, piece, events);

  // A first capture that already checkmates ends the game, extra move or not
  if (extraMove && !state.winner && !mateAfterMove(state)) {
    state.extraMovePieceId = piece.id;
    events.push({ type: 'extraMove', piece: ref(piece) });
  } else {
    endTurn(state, events);
  }
};

const mateAfterMove = (state: GameState) => {
  const enemy = opponent(state.turn);
  return inCheck(state, enemy) && !hasLegalAction(state, enemy);
};

// A bishop spends its turn healing itself and the hurt pieces next to it
const bishopHeal = (state: GameState, pieceId: string, events: GameEvent[]) => {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.color !== state.turn || piece.type !== 'b') {
    throw new RuleError('Only your own bishop can heal');
  }
  const targets = bishopHealTargets(state, piece);
  if (targets.length === 0) {
    throw new RuleError('That bishop has nothing to heal');
  }
  if (state.extraMovePieceId) {
    throw new RuleError('Use or skip the extra move first');
  }
  if (inCheck(state, piece.color)) {
    throw new RuleError("You can't heal while in check");
  }
  for (const target of targets) heal(target, piece, events);
  state.enPassant = null;
  endTurn(state, events);
};

// The psychopath's extra move is optional
const skipExtraMove = (state: GameState, events: GameEvent[]) => {
  const piece = state.pieces.find((p) => p.id === state.extraMovePieceId);
  if (!piece) throw new RuleError('There is no extra move to skip');
  events.push({ type: 'skipExtraMove', piece: ref(piece) });
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
    move(next, action, rollDie, events);
  } else if (action.type === 'bishopHeal') {
    bishopHeal(next, action.pieceId, events);
  } else {
    skipExtraMove(next, events);
  }
  return { state: next, events };
};
