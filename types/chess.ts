import { Color } from 'chess.js';

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
  principalVariation: string[];
}

export interface ThinkResult {
  bestMove: string;
  evaluation: Evaluation;
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
  evalBefore: Evaluation;
  evalAfter: Evaluation;
}

export interface Analysis extends _AnalysisWithoutClassification {
  classificationStockfishWDL: MoveClassification;
  classificationLichessFormula: MoveClassification;
  classificationStandardLogisticFormula: MoveClassification;
}