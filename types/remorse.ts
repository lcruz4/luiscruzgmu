export type Color = 'w' | 'b';
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type Trauma = 'devastated' | 'guilt' | 'unaffected' | 'psychopath';

export interface Piece {
  id: string;
  color: Color;
  type: PieceType;
  square: string;
  trauma: Trauma | null;
  healed: boolean;
  // devastated: own turns left before the piece dies
  turnsLeft: number;
  devastatedOnTurn: number | null;
  // psychopath: captures since turning, 3 = bloodlust
  kills: number;
}

export interface GameState {
  pieces: Piece[];
  turn: Color;
  // the psychopath that may make an optional bonus move (only it can move)
  extraMovePieceId: string | null;
  turnNumber: number;
  winner: Color | null;
  // square a pawn just skipped with a double step, capturable en passant
  enPassant: string | null;
}

export type PromotionType = 'q' | 'r' | 'b' | 'n';

// promotion: required when a pawn reaches the last rank
export interface MoveAction {
  type: 'move';
  from: string;
  to: string;
  promotion?: PromotionType;
}

export type Action =
  | MoveAction
  | { type: 'selfHeal'; pieceId: string }
  | { type: 'skipExtraMove' };

export interface PieceRef {
  id: string;
  color: Color;
  type: PieceType;
}

export type GameEvent =
  | { type: 'move'; piece: PieceRef; from: string; to: string }
  | { type: 'castle'; rook: PieceRef; from: string; to: string }
  | { type: 'promote'; piece: PieceRef }
  | { type: 'capture'; piece: PieceRef; captured: PieceRef }
  | { type: 'roll'; piece: PieceRef; roll: number; trauma: Trauma }
  | { type: 'reactivate'; piece: PieceRef; trauma: Trauma }
  | { type: 'kill'; piece: PieceRef; kills: number }
  | { type: 'bloodlust'; piece: PieceRef }
  | { type: 'extraMove'; piece: PieceRef }
  | { type: 'skipExtraMove'; piece: PieceRef }
  | { type: 'heal'; piece: PieceRef; healer: PieceRef }
  | { type: 'death'; piece: PieceRef }
  | { type: 'gameOver'; winner: Color };

export type GameMode = 'online' | 'local';

export interface GameStep {
  step: number;
  color: Color;
  events: GameEvent[];
  createdAt: string;
}

export interface GameSummary {
  id: number;
  mode: GameMode;
  whiteEmail: string | null;
  blackEmail: string | null;
  turn: Color;
  winner: Color | null;
  updatedAt: string;
}

export interface GameResponse {
  id: number;
  mode: GameMode;
  whiteEmail: string | null;
  blackEmail: string | null;
  state: GameState;
  version: number;
  steps: GameStep[];
  // colors the viewer plays (both in a local game, none for a spectator)
  you: Color[];
  canUndo: boolean;
}
