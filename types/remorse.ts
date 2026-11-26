import type { PlayerIcon } from '@/lib/remorse/icons';
import type { TimeCategory } from '@/lib/remorse/timeControls';

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
  // king and rooks: castling needs both unmoved
  moved: boolean;
}

export interface GameState {
  pieces: Piece[];
  turn: Color;
  // the psychopath that may make an optional bonus move (only it can move)
  extraMovePieceId: string | null;
  turnNumber: number;
  winner: Color | 'draw' | null;
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
  | { type: 'bishopHeal'; pieceId: string }
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
  | { type: 'check'; color: Color }
  | {
      type: 'gameOver';
      winner: Color | 'draw';
      reason: 'king' | 'checkmate' | 'stalemate' | 'resign' | 'timeout';
    };

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
  // their player pages
  whiteId: number | null;
  blackId: number | null;
  whiteName: string | null;
  blackName: string | null;
  // null: the default icon
  whiteIcon: PlayerIcon | null;
  blackIcon: PlayerIcon | null;
  // as of the game's end once it's over, current until then; null for a
  // local game or an empty seat
  whiteRating: number | null;
  blackRating: number | null;
  turn: Color;
  winner: Color | 'draw' | null;
  pieces: Pick<Piece, 'color' | 'type' | 'square'>[];
  archived: boolean;
  // an online game with both seats taken, not over, waiting on the viewer
  yourMove: boolean;
  // the rematch of this game, once someone started one
  rematchId: number | null;
  // the invite link's secret while a friend game waits for its opponent
  inviteToken: string | null;
  // a random game: its open seat goes to the next player looking for one
  matchmaking: boolean;
  challenge: Challenge | null;
  // balance mode: the die leans toward the lower-rated player; unrated
  balanced: boolean;
  // an id from TIME_CONTROLS; null for an untimed game from before them
  timeControl: string | null;
  updatedAt: string;
}

// The player a challenge waits on to accept; `you`: the viewer is them
export interface Challenge {
  playerId: number;
  name: string;
  icon: PlayerIcon | null;
  rating: number;
  you: boolean;
}

export interface PlayerRef {
  id: number;
  name: string;
  icon: PlayerIcon | null;
}

// Someone who followed you since you last looked; followingBack: you
// already follow them
export interface NewFollower extends PlayerRef {
  followingBack: boolean;
}

// An online game on a player's page, open to anyone to watch
export interface PlayerGame {
  id: number;
  whiteId: number | null;
  blackId: number | null;
  whiteName: string | null;
  blackName: string | null;
  whiteIcon: PlayerIcon | null;
  blackIcon: PlayerIcon | null;
  // as of the game's end once it's over, current until then
  whiteRating: number;
  blackRating: number;
  turn: Color;
  winner: Color | 'draw' | null;
  pieces: Pick<Piece, 'color' | 'type' | 'square'>[];
  timeControl: string | null;
  updatedAt: string;
}

export interface PlayerPage extends PlayerRef {
  // the viewer's own page
  you: boolean;
  // the viewer follows them, and the other way round: needed to challenge
  following: boolean;
  followsYou: boolean;
  stats: PlayerStats;
  // the viewer's games against them; null on your own page
  headToHead: {
    wins: number;
    losses: number;
    draws: number;
    // first-capture rolls in those games, yours and theirs
    yourTraumas: Record<Trauma, number>;
    theirTraumas: Record<Trauma, number>;
  } | null;
  games: PlayerGame[];
}

export interface PlayerStats {
  ratings: Record<TimeCategory, number>;
  // finished online games against someone else
  wins: number;
  losses: number;
  draws: number;
  // how your pieces took their first capture
  traumas: Record<Trauma, number>;
}

export interface GameResponse {
  id: number;
  mode: GameMode;
  whiteEmail: string | null;
  blackEmail: string | null;
  // their player pages
  whiteId: number | null;
  blackId: number | null;
  whiteName: string | null;
  blackName: string | null;
  // null: the default icon
  whiteIcon: PlayerIcon | null;
  blackIcon: PlayerIcon | null;
  // online only: as of the game's end once it's over, current until then
  whiteRating: number | null;
  blackRating: number | null;
  // what the finished game gained or lost them
  whiteRatingChange: number | null;
  blackRatingChange: number | null;
  state: GameState;
  version: number;
  steps: GameStep[];
  // colors the viewer plays (both in a local game, none for a spectator)
  you: Color[];
  rematchId: number | null;
  // the invite link's secret; only sent to the player waiting on it
  inviteToken: string | null;
  matchmaking: boolean;
  challenge: Challenge | null;
  // balance mode: the die leans toward the lower-rated player; unrated
  balanced: boolean;
  // each side's first-capture odds, once both seats are taken
  balance: Record<Color, Record<Trauma, number>> | null;
  // the creator set the odds by hand
  balanceCustom: boolean;
  // the viewer created this balanced game and nobody has moved yet
  canSetOdds: boolean;
  // shown once the game is over, while the viewer hasn't answered it
  balanceSuggestion: BalanceSuggestion | null;
  timeControl: string | null;
  clock: GameClock | null;
}

// A timed game's clocks. whiteMs/blackMs: a live game's time left for each
// side as of its last turn (null in a daily game). runningMs: the side to
// move's time left as of this response; null while no clock runs.
export interface GameClock {
  whiteMs: number | null;
  blackMs: number | null;
  runningMs: number | null;
}

// One player has won most standard games between the two: suggest playing
// balanced. wins/losses: the viewer's.
export interface BalanceSuggestion {
  playerId: number;
  name: string;
  games: number;
  wins: number;
  losses: number;
}
