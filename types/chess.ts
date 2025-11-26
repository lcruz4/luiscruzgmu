import { Color, Move } from 'chess.js';

export interface StockfishOptions {
  Contempt?: number;
  Hash?: number;
  Threads?: number;
  UCI_AnalyseMode?: boolean;
  UCI_ShowWDL?: boolean;
}

export interface SearchOptions {
  depth?: number;
  nodes?: number;
  mate?: number;
  movetime?: number;
  infinite?: boolean;
}

export enum ScoreType {
  CENTIPAWN = 'cp',
  MATE = 'mate',
}

export interface Evaluation {
  depth: number;
  [ScoreType.CENTIPAWN]?: number;
  [ScoreType.MATE]?: number;
  win: number;
  draw: number;
  lose: number;
  time: number;
  lines: string[][];
}

export enum MoveClassification {
  BOOK = 'Book',
  BEST = 'Best',
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  INACCURACY = 'Inaccuracy',
  MISTAKE = 'Mistake',
  BLUNDER = 'Blunder',
}

export interface _AnalysisWithoutClassification {
  move: string;
  turn: Color;
  bestMove: string;
  anticipatedMove: string;
  evalBefore: Evaluation;
  evalAfter: Evaluation;
}

export interface Analysis {
  move: string;
  turn: Color;
  bestMove: string;
  eval: Evaluation;
  classificationStockfishWDL: MoveClassification;
  classificationLichessFormula: MoveClassification;
  classificationStandardLogisticFormula: MoveClassification;
}

enum ChessComGameResult {
  Win = 'win',
  Loss = 'loss',
  Draw = 'draw',
}

interface ChessComPlayer {
  rating: number;
  result: ChessComGameResult;
  '@id': string;
  username: string;
  uuid: string;
}

export interface ChessComGameReponse {
  accuracies?: {
    white: number;
    black: number;
  };
  black: ChessComPlayer;
  eco: string;
  end_time: number;
  fen: string;
  initial_setup: string;
  pgn: string;
  rated: boolean;
  rules: string;
  tcn: string;
  time_class: string;
  time_control: string;
  url: string;
  uuid: string;
  white: ChessComPlayer;
}

export interface AnalyzedMove extends Move {
  analysis?: Analysis;
}

export interface FullMoveHistory {
  moveNumber: number;
  whiteMove: Move;
  blackMove?: Move;
}
