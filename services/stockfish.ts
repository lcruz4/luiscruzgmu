import { Chess, WHITE } from 'chess.js';
import { type ChildProcessWithoutNullStreams, spawn } from 'child_process';
import {
  _AnalysisWithoutClassification,
  Analysis,
  Evaluation,
  MoveClassification,
  ScoreType,
  SearchOptions,
  StockfishOptions,
} from '../types/chess';
import { redis } from './redis';
import { logger } from './logger';

const DEPTH = 18;
const LICHESS_EXP = -0.00368208;

/**
 * classifies move based on expected points lost
 * @param expectedPointsLost number subtract win eval before - win eval after
 * @param isBestMove boolean whether the move is the best move
 * @returns string
 */
export const classifyMove = (
  expectedPointsLost: number,
  isBestMove?: boolean,
): MoveClassification => {
  if (expectedPointsLost <= 0 || isBestMove) return MoveClassification.BEST;
  if (expectedPointsLost <= 2) return MoveClassification.EXCELLENT;
  if (expectedPointsLost <= 5) return MoveClassification.GOOD;
  if (expectedPointsLost <= 10) return MoveClassification.INACCURACY;
  if (expectedPointsLost <= 20) return MoveClassification.MISTAKE;
  return MoveClassification.BLUNDER;
};

class Stockfish {
  private _chess: Chess = new Chess();
  private readonly _process: ChildProcessWithoutNullStreams = spawn(
    '/opt/homebrew/bin/stockfish',
  );
  private _lock: Promise<void> = Promise.resolve();
  private _stdoutQueue: string[] = [];
  private _processedQueue: (string | Evaluation)[] = [];
  private _lastBestMove?: string;
  private _lastEvaluation?: Evaluation;
  isLockFree = true;

  constructor(options?: StockfishOptions) {
    this.reserveLock();
    this._process.stdout.on('data', (data) => {
      this._stdoutQueue.push(...data.toString().split('\n'));
    });

    this._process.stderr.on('data', (data) => {
      logger.error(`Stockfish stderr: ${data.toString()}`);
    });

    if (!options) {
      options = {
        Threads: 6,
        Hash: 1024,
        UCI_ShowWDL: true,
        UCI_AnalyseMode: true,
        Contempt: 0,
      };
    }
    for (const [option, value] of Object.entries(options)) {
      this._process.stdin.write(`setoption name ${option} value ${value}\n`);
    }

    this._stdoutQueue = [];
  }

  private async _acquireLock() {
    await this._lock;

    this.isLockFree = false;
    let _resolve: () => void;
    this._lock = new Promise((resolve) => {
      _resolve = resolve;
    });

    return this._getLockRelease(_resolve!);
  }

  private _getLockRelease(resolve: () => void) {
    return () => {
      this.isLockFree = true;
      this._chess = new Chess();
      this._stdoutQueue = [];
      this._processedQueue = [];
      this._lastBestMove = undefined;
      this._lastEvaluation = undefined;
      resolve();
    };
  }

  private _processQueue = async (stopKeyword: string) => {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        let quit = false;

        const queue = [...this._stdoutQueue];
        this._stdoutQueue = [];
        for (const line of queue) {
          if (line.trim() === '') continue;

          if (line.startsWith('info') && !line.startsWith('info string')) {
            const match = line.match(
              /.* depth (\d+).* score (cp|mate) (-?\d+).* wdl (\d+) (\d+) (\d+).* time (\d+).* pv (.*)/,
            );

            if (match) {
              const turn = this._chess.turn();
              const [
                ,
                depth,
                scoreType,
                scoreValue,
                win,
                draw,
                lose,
                time,
                pv,
              ] = match;
              if (
                scoreType !== ScoreType.CENTIPAWN &&
                scoreType !== ScoreType.MATE
              ) {
                throw new Error(`Unrecognized score type: ${scoreType}`);
              }
              const evaluation: Evaluation = {
                depth: parseInt(depth),
                ...(scoreType === ScoreType.CENTIPAWN
                  ? {
                      [ScoreType.CENTIPAWN]:
                        parseInt(scoreValue) * (turn === WHITE ? 1 : -1),
                    }
                  : {
                      [ScoreType.MATE]:
                        parseInt(scoreValue) * (turn === WHITE ? 1 : -1),
                    }),
                win: turn === WHITE ? parseInt(win) : parseInt(lose),
                draw: parseInt(draw),
                lose: turn === WHITE ? parseInt(lose) : parseInt(win),
                time: parseInt(time),
                lines: [this._lanToSan(pv.split(' '))],
              };

              this._processedQueue.unshift(evaluation);
              this._lastEvaluation = evaluation;
            } else {
              logger.warn(`Unrecognized info format [${line}]`);
              this._processedQueue.unshift(line);
            }
          }

          if (line.startsWith('bestmove')) {
            const bestMove = line.split(' ')[1];

            if (
              !/^([a-h][1-8])([a-h][1-8])[qrbn]?$/.test(bestMove) &&
              bestMove !== '(none)'
            ) {
              throw new Error(`Unrecognized bestmove format: [${bestMove}]`);
            }

            this._processedQueue.unshift(line.split(' ')[1]);
            this._lastBestMove = bestMove;
          }
          this._processedQueue = this._processedQueue.slice(0, 100); // keep last 100 lines
          if (line.startsWith(stopKeyword)) {
            quit = true;
          }
        }

        if (quit) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  private _lanToSan = (lanArr: string[]): string[] => {
    const moves: string[] = [];
    for (const lan of lanArr) {
      const move = this._chess.move(lan);
      if (!move) {
        throw new Error(`Invalid LAN move: ${lan}`);
      }
      moves.push(move.san);
    }
    for (const _ of lanArr) this._chess.undo();

    return moves;
  };

  private _getStockfishWDLClassification = (
    { turn, evalBefore, evalAfter }: _AnalysisWithoutClassification,
    isBestMove?: boolean,
  ): MoveClassification => {
    const pointsLost =
      turn === WHITE
        ? evalBefore.win +
          evalBefore.draw / 2 -
          (evalAfter.win + evalAfter.draw / 2)
        : evalBefore.lose +
          evalBefore.draw / 2 -
          (evalAfter.lose + evalAfter.draw / 2);
    // points are out of 1000 so we need to divide by 10 to make it out of 100
    return classifyMove(pointsLost / 10, isBestMove);
  };

  private _getLichessFormulaClassification = (
    { turn, evalBefore, evalAfter }: _AnalysisWithoutClassification,
    isBestMove?: boolean,
  ): MoveClassification => {
    const centiPawnBefore =
      evalBefore[ScoreType.CENTIPAWN] ??
      10000 * (evalBefore[ScoreType.MATE] ?? 0);
    const centiPawnAfter =
      evalAfter[ScoreType.CENTIPAWN] ??
      10000 * (evalAfter[ScoreType.MATE] ?? 0);
    const winPBefore =
      50 + 50 * (2 / (1 + Math.exp(LICHESS_EXP * centiPawnBefore)) - 1);
    const winPAfter =
      50 + 50 * (2 / (1 + Math.exp(LICHESS_EXP * centiPawnAfter)) - 1);
    const pointsLost =
      turn === WHITE ? winPBefore - winPAfter : winPAfter - winPBefore;

    return classifyMove(pointsLost, isBestMove);
  };

  private _getStandardLogisticFormulaClassification = (
    { turn, evalBefore, evalAfter }: _AnalysisWithoutClassification,
    isBestMove?: boolean,
  ): MoveClassification => {
    const centiPawnBefore =
      evalBefore[ScoreType.CENTIPAWN] ??
      10000 * (evalBefore[ScoreType.MATE] ?? 0);
    const centiPawnAfter =
      evalAfter[ScoreType.CENTIPAWN] ??
      10000 * (evalAfter[ScoreType.MATE] ?? 0);
    const winPBefore = 100 / (1 + Math.pow(10, -centiPawnBefore / 4 / 100));
    const winPAfter = 100 / (1 + Math.pow(10, -centiPawnAfter / 4 / 100));
    const pointsLost =
      turn === WHITE ? winPBefore - winPAfter : winPAfter - winPBefore;

    return classifyMove(pointsLost, isBestMove);
  };

  private _getMaxDepthCacheKey = async (
    stockfishMoves: string[],
  ): Promise<string> => {
    logger.debug(
      `Getting max depth cache key for moves: [${stockfishMoves.join(' ')}]`,
    );
    const keys = await redis.keys(`chess:${stockfishMoves.join('_')}:*`);
    if (keys.length)
      logger.debug(`Found keys for max depth cache key: [${keys.join(', ')}]`);
    const maxDepth = keys.reduce<number>((acc, key) => {
      const keyDepth = parseInt(key.split(':').at(-1) ?? '0');
      return keyDepth > acc ? keyDepth : acc;
    }, DEPTH);
    logger.debug(
      `returning max depth key: [chess:${stockfishMoves.join(
        '_',
      )}:${maxDepth}]`,
    );
    return `chess:${stockfishMoves.join('_')}:${maxDepth}`;
  };

  /**
   * sets position given an array of moves in LAN format
   * @param moves string[]
   * @param lockID number
   */
  private _setPosition = async (moves: string[] = []) => {
    this._process.stdin.write(`position startpos moves ${moves.join(' ')}\n`);
  };

  /**
   * thinks at DEPTH and returns results when it's done
   * @param options SearchOptions
   * @param lockID number
   * @returns \{
   *  bestMove: string;
   *  evaluation: Evaluation;
   * }
   */
  private _think = async (options: SearchOptions = {}) => {
    let command = 'go';
    for (const [option, value] of Object.entries(options)) {
      command += ` ${option} ${value}`;
    }
    this._process.stdin.write(`${command}\n`);

    await this._processQueue('bestmove');

    return {
      bestMove: this._lastBestMove === '(none)' ? '' : this._lastBestMove!,
      evaluation: this._lastEvaluation!,
    };
  };

  reserveLock = () => {
    if (!this.isLockFree) {
      return false;
    }
    this.isLockFree = false;
    setTimeout(async () => {
      (await this._acquireLock())();
    }, 100); // release lock after 100ms if it hasn't been locked via _acquireLock
    return true;
  };

  analyzeGame = async (pgn: string): Promise<Analysis[]> => {
    const release = await this._acquireLock();
    try {
      const gameAnalysis: Analysis[] = [];
      logger.trace(`Starting analysis for game:\n${pgn.slice(0, 100)}...`);
      this._chess.loadPgn(pgn);
      const history = this._chess.history({ verbose: true });
      const stockfishMoves: string[] = [];

      this._chess.reset();
      const cacheKey = await this._getMaxDepthCacheKey([]);
      let { bestMove, evalBefore } = await redis.withCache(
        {
          key: cacheKey,
          keyOnSet: `chess::${DEPTH}`,
          extraData: {
            createdAt: Date.now(),
          },
        },
        async () => {
          await this._setPosition([]);
          const thinkRes = await this._think({ depth: DEPTH });

          return {
            move: 'startpos',
            turn: WHITE,
            bestMove: 'e2e4',
            anticipatedMove: thinkRes.bestMove,
            evalBefore: thinkRes.evaluation,
            evalAfter: thinkRes.evaluation,
            classificationStockfishWDL: MoveClassification.BOOK,
            classificationLichessFormula: MoveClassification.BOOK,
            classificationStandardLogisticFormula: MoveClassification.BOOK,
          };
        },
      );
      for (const move of history) {
        const moveFormatted = `${this._chess.moveNumber()}.${
          move.color === WHITE ? '' : '..'
        } ${move.san}`;
        logger.info(`Analyzing move: ${moveFormatted}`);
        const turn = this._chess.turn();
        this._chess.move(move.san);
        stockfishMoves.push(move.lan);

        const cacheKey = await this._getMaxDepthCacheKey(stockfishMoves);
        const moveAnalysis = await redis.withCache(
          {
            key: cacheKey,
            keyOnSet: `chess:${stockfishMoves.join('_')}:${DEPTH}`,
            extraData: {
              createdAt: Date.now(),
            },
          },
          async () => {
            await this._setPosition(stockfishMoves);
            const { bestMove: anticipatedMove, evaluation: evalAfter } =
              await this._think({ depth: DEPTH });

            const partialGameAnalysis = {
              move: moveFormatted,
              turn,
              bestMove,
              anticipatedMove,
              evalBefore,
              evalAfter,
            };

            return {
              ...partialGameAnalysis,
              classificationStockfishWDL: this._getStockfishWDLClassification(
                partialGameAnalysis,
                bestMove === `${move.from}${move.to}`,
              ),
              classificationLichessFormula:
                this._getLichessFormulaClassification(
                  partialGameAnalysis,
                  bestMove === `${move.from}${move.to}`,
                ),
              classificationStandardLogisticFormula:
                this._getStandardLogisticFormulaClassification(
                  partialGameAnalysis,
                  bestMove === `${move.from}${move.to}`,
                ),
            };
          },
        );

        const {
          evalBefore: _,
          anticipatedMove: __,
          evalAfter,
          ...analysisToPush
        } = moveAnalysis;

        gameAnalysis.push({ ...analysisToPush, eval: evalAfter });

        bestMove = moveAnalysis.anticipatedMove;
        evalBefore = moveAnalysis.evalAfter;
      }

      return gameAnalysis;
    } finally {
      release();
      logger.info(`Analyzis complete 🥳`);
    }
  };

  kill = () => {
    this._process.kill();
  };
}

class StockfishService {
  static _singleton: StockfishService = new StockfishService();
  private _instances: Stockfish[] = [];
  private POOLSIZE = 5;

  private _getNextAvailableInstance = async (): Promise<Stockfish> => {
    let waitTimeout = 1000;

    while (true) {
      if (this._instances.length < this.POOLSIZE) {
        const i = this._instances.push(new Stockfish()) - 1;

        if (i === this.POOLSIZE) {
          const overflowedInstance = this._instances.pop()!;
          overflowedInstance.kill();
          continue;
        }
        logger.info(
          `Created new Stockfish instance. Total instances: ${this._instances.length}`,
        );
        return this._instances.at(i)!;
      }

      const availableInstance = this._instances.find((instance) =>
        instance.reserveLock(),
      );
      if (availableInstance) {
        return availableInstance;
      }

      logger.info(
        `All Stockfish instances are busy. Waiting ${waitTimeout / 1000}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTimeout));
      waitTimeout *= 1.5;
    }
  };

  analyzeGame = async (pgn: string): Promise<Analysis[]> => {
    const instance = await this._getNextAvailableInstance();
    return instance.analyzeGame(pgn);
  };

  // Method for testing - kill all instances
  killAllInstances = () => {
    this._instances.forEach((instance) => {
      try {
        instance.kill();
      } catch (error) {
        logger.warn('Error killing Stockfish instance:', error);
      }
    });
    this._instances = [];
  };

  // Get number of active instances (for testing)
  getInstanceCount = () => {
    return this._instances.length;
  };
}

export const stockfishService = StockfishService._singleton;
