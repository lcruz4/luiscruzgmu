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
  // the side to move is on its psychopath's bonus move
  extraMove: boolean;
  turnNumber: number;
  winner: Color | null;
}

export type Action =
  | { type: 'move'; from: string; to: string }
  | { type: 'selfHeal'; pieceId: string };

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
  | { type: 'extraMove'; color: Color }
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
