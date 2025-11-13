import { Chess, WHITE } from 'chess.js';
import { type ChildProcessWithoutNullStreams, spawn } from 'child_process';

const DEPTH = 18;

interface StockfishOptions {
  Contempt?: number;
  Hash?: number;
  Threads?: number;
  UCI_AnalyseMode?: boolean;
  UCI_ShowWDL?: boolean;
}

interface SearchOptions {
  depth?: number;
  nodes?: number;
  mate?: number;
  movetime?: number;
  infinite?: boolean;
}

enum ScoreType {
  CENTIPAWN = 'cp',
  MATE = 'mate',
}

interface _ProcessedLine {
  depth: number;
  win: number;
  draw: number;
  lose: number;
  time: number;
  principalVariation: string[];
}

type Evaluation = _ProcessedLine &
  (
    | {
        [ScoreType.CENTIPAWN]: number;
      }
    | {
        [ScoreType.MATE]: number;
      }
  );

interface ThinkResult {
  bestMove: string;
  evaluation: Evaluation;
}

enum MoveClassification {
  BEST = 'Best',
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  INACCURACY = 'Inaccuracy',
  MISTAKE = 'Mistake',
  BLUNDER = 'Blunder',
}

export interface Analysis {
  move: string;
  bestMove: string;
  evalBefore: Evaluation;
  evalAfter: Evaluation;
  classification: MoveClassification;
}

class Stockfish {
  private _chess: Chess = new Chess();
  private _process: ChildProcessWithoutNullStreams = spawn(
    '/opt/homebrew/bin/stockfish',
  );
  private _lock: number = 1;
  private _stdoutQueue: string[] = [];
  private _processedQueue: (string | Evaluation)[] = [];
  private _lastBestMove?: string;
  private _lastEvaluation?: Evaluation;

  constructor(options?: StockfishOptions) {
    this._process.stdout.on('data', (data) => {
      this._stdoutQueue.push(...data.toString().split('\n'));
    });

    this._process.stderr.on('data', (data) => {
      console.error(`Stockfish stderr: ${data.toString()}`);
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

    this._lock = 0;
  }

  private _withLock = async (
    callback: (lockID: number) => Promise<void>,
    lockID?: number,
  ) => {
    const _lockID = lockID || Date.now();
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        clearInterval(interval);
        throw new Error('Timeout waiting for lock');
      }, 60000); // Timeout after 60 seconds
      const interval = setInterval(async () => {
        if (!this._lock || this._lock === _lockID) {
          this._lock = _lockID;
          clearTimeout(timeout);
          clearInterval(interval);
          await callback(_lockID);
          this._lock = 0;
          resolve(null);
        }
      }, 100); // check for lock release every 100ms
    });
    return;
  };

  private _processQueue = async (stopKeyword: string, lockID?: number) => {
    return await this._withLock(async () => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          let quit = false;

          const queue = [...this._stdoutQueue];
          this._stdoutQueue = [];
          for (const line of queue) {
            if (line.trim() === '') continue;

            if (line.startsWith('info') && !line.startsWith('info string')) {
              const match = line.match(
                /.* depth (\d+) .* score (cp|mate) (-?\d+) .* wdl (\d+) (\d+) (\d+) .* time (\d+) .* pv (.*)/,
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
                const evaluation: Evaluation = {
                  depth: parseInt(depth),
                  ...(scoreType === ScoreType.CENTIPAWN
                    ? {
                        [ScoreType.CENTIPAWN]:
                          parseInt(scoreValue) * (turn === WHITE ? 1 : -1),
                      }
                    : { [ScoreType.MATE]: parseInt(scoreValue) }),
                  win: turn === WHITE ? parseInt(win) : parseInt(lose),
                  draw: parseInt(draw),
                  lose: turn === WHITE ? parseInt(lose) : parseInt(win),
                  time: parseInt(time),
                  principalVariation: pv.split(' '),
                };

                this._processedQueue.unshift(evaluation);
                this._lastEvaluation = evaluation;
              } else {
                console.warn('Unrecognized info line:', line);
                this._processedQueue.unshift(line);
              }
            }

            if (line.startsWith('bestmove')) {
              const bestMove = line.split(' ')[1];

              if (!/^([a-h][1-8])([a-h][1-8])[qrbn]?$/.test(bestMove)) {
                throw new Error(`Unrecognized bestmove format: ${bestMove}`);
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
    }, lockID);
  };

  _lanToSan = (lan: string): string => {
    const move = this._chess.move(lan);
    if (!move) {
      throw new Error(`Invalid LAN move: ${lan}`);
    }
    const san = move.san;
    this._chess.undo();
    return san;
  };

  /**
   * classifies move based on expected points lost
   * @param expectedPointsLost number subtract win eval before - win eval after
   * @returns string
   */
  classifyMove = (expectedPointsLost: number): MoveClassification => {
    if (expectedPointsLost <= 0) return MoveClassification.BEST;
    if (expectedPointsLost <= 20) return MoveClassification.EXCELLENT;
    if (expectedPointsLost <= 50) return MoveClassification.GOOD;
    if (expectedPointsLost <= 100) return MoveClassification.INACCURACY;
    if (expectedPointsLost <= 200) return MoveClassification.MISTAKE;
    return MoveClassification.BLUNDER;
  };

  /**
   * sets position given an array of moves in LAN format
   * @param moves string[]
   * @param lockID number
   */
  setPosition = async (moves: string[] = [], lockID?: number) => {
    await this._withLock(async () => {
      this._process.stdin.write(`position startpos moves ${moves.join(' ')}\n`);
    }, lockID);
  };

  /**
   * thinks at DEPTH and returns ThinkResult when it's done
   * @param options SearchOptions
   * @param lockID number
   * @returns ThinkResult - bestMove is in SAN
   */
  think = async (
    options: SearchOptions = {},
    lockID?: number,
  ): Promise<ThinkResult> => {
    await this._withLock(async () => {
      let command = 'go';
      for (const [option, value] of Object.entries(options)) {
        command += ` ${option} ${value}`;
      }
      this._process.stdin.write(`${command}\n`);

      await this._processQueue('bestmove', lockID);
    }, lockID);

    return {
      bestMove: this._lanToSan(this._lastBestMove!),
      evaluation: this._lastEvaluation!,
    };
  };

  analyzeGame = async (pgn: string): Promise<Analysis[]> => {
    this._chess = new Chess();
    const gameAnalysis: Analysis[] = [];
    await this._withLock(async (lockID: number) => {
      this._chess.loadPgn(pgn);
      const history = this._chess.history({ verbose: true });
      const stockfishMoves: string[] = [];

      this._chess.reset();
      await this.setPosition([], lockID);
      let { bestMove, evaluation: evalBefore } = await this.think(
        { depth: DEPTH },
        lockID,
      );
      for (const move of history) {
        const moveFormatted = `${this._chess.moveNumber()}.${
          move.color === WHITE ? '' : '..'
        } ${move.san}`;
        console.log(`Analyzing move: ${moveFormatted}`);
        const turn = this._chess.turn();
        this._chess.move(move);
        stockfishMoves.push(move.lan);
        await this.setPosition(stockfishMoves, lockID);
        const { bestMove: nextBestMove, evaluation: evalAfter } =
          await this.think({ depth: DEPTH }, lockID);
        const pointsLost =
          turn === WHITE
            ? evalBefore.win +
              evalBefore.draw / 2 -
              (evalAfter.win + evalAfter.draw / 2)
            : evalBefore.lose +
              evalBefore.draw / 2 -
              (evalAfter.lose + evalAfter.draw / 2);

        gameAnalysis.push({
          move: moveFormatted,
          bestMove,
          evalBefore,
          evalAfter,
          classification: this.classifyMove(pointsLost),
        });

        bestMove = nextBestMove;
        evalBefore = evalAfter;
      }
    });

    return gameAnalysis;
  };
}

export const stockfishService = new Stockfish();
