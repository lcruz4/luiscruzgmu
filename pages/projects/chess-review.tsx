import { BLACK, Chess, Color, Move, WHITE } from 'chess.js';
import Link from 'next/link';
import { DragEvent, useEffect, useRef, useState } from 'react';
import {
  LeftStopChevron,
  LeftChevron,
  RightChevron,
  RightStopChevron,
} from '../../components/icons';

const chess = new Chess();

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

interface ChessComGameReponse {
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

interface History {
  moveNumber: number;
  whiteMove: Move;
  blackMove?: Move;
}

export const ChessReview = () => {
  const [pieces, setPieces] = useState(chess.board());
  const [activeTab, setActiveTab] = useState<'games' | 'analysis'>('games');
  const [inputValue, setInputValue] = useState('');
  const [fetchedGames, setFetchedGames] = useState<ChessComGameReponse[]>([]);
  const [fetchGamesError, setFetchGamesError] = useState('');
  const [selectedGame, setSelectedGame] = useState<ChessComGameReponse | null>(
    null,
  );
  const [fullMoveHistory, setFullMoveHistory] = useState<History[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const dragNodeRef = useRef<HTMLImageElement | null>(null);
  const dragLocationRef = useRef<{
    x: number;
    y: number;
    top: number;
    left: number;
  } | null>(null);
  const moveRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedGame) {
      chess.loadPgn(selectedGame.pgn);
      const chessHistory = chess.history({ verbose: true });
      const _history = chessHistory.reduce<History[]>((acc, move, index) => {
        if (index % 2 === 0) {
          const moveNumber = Math.ceil((index + 1) / 2);
          const blackMove = chessHistory[index + 1];
          acc.push({ moveNumber, whiteMove: move, blackMove });
        }
        return acc;
      }, []);
      setHistory(chessHistory);
      setFullMoveHistory(_history);
      chess.reset();
      setPieces(chess.board());
    }
  }, [selectedGame]);

  const handleChessMove = (from: string, to: string) => {
    try {
      const move = chess.move({ from, to });
      setPieces(chess.board());
      return move;
    } catch (error) {
      return null;
    }
  };

  const handleDragStart = (
    event: DragEvent<HTMLImageElement>,
    square: string,
  ) => {
    event.dataTransfer.clearData();
    event.dataTransfer.setData('text/plain', square);
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.style.cursor = 'grabbing';

    dragLocationRef.current = {
      x: event.clientX,
      y: event.clientY,
      top: event.currentTarget.offsetTop,
      left: event.currentTarget.offsetLeft,
    };
  };

  const handleDrag = (
    event: DragEvent<HTMLImageElement>,
    square: string,
    imageName: string,
  ) => {
    if (!dragLocationRef.current) return;
    if (!dragNodeRef.current) {
      const originalElement = event.currentTarget as HTMLImageElement;
      const clone = originalElement.cloneNode() as HTMLImageElement;
      originalElement.parentElement?.appendChild(clone);
      originalElement.style.visibility = 'hidden';
      clone.classList.add(`clone-of-${imageName}-on-${square}`);
      clone.style.cursor = 'grabbing';
      clone.style.pointerEvents = 'none';
      dragNodeRef.current = clone;
    }

    const startingX = dragLocationRef.current.x ?? 0;
    const startingY = dragLocationRef.current.y ?? 0;
    const deltaX = event.clientX - startingX;
    const deltaY = event.clientY - startingY;
    const newTop = (dragLocationRef.current.top ?? 0) + deltaY;
    const newLeft = (dragLocationRef.current.left ?? 0) + deltaX;

    dragNodeRef.current.style.top = `${newTop}px`;
    dragNodeRef.current.style.left = `${newLeft}px`;
  };

  const handleDragEnd = (event: DragEvent<HTMLImageElement>) => {
    if (!dragLocationRef.current || !dragNodeRef.current) return;
    const originalElement = event.currentTarget as HTMLImageElement;
    dragNodeRef.current.classList.add(
      'transition-all',
      'duration-300',
      'ease-out',
    );
    dragNodeRef.current.ontransitionend = () => {
      dragNodeRef.current?.remove();
      dragNodeRef.current = null;
      originalElement.style.visibility = 'visible';
    };
    dragNodeRef.current.style.top = `${dragLocationRef.current.top}px`;
    dragNodeRef.current.style.left = `${dragLocationRef.current.left}px`;
    dragLocationRef.current = null;
    originalElement.style.cursor = 'grab';
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.add('border-2', 'border-blue-400');
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('border-2', 'border-blue-400');
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, square: string) => {
    const originalLocation = event.dataTransfer.getData('text/plain');
    event.currentTarget.classList.remove('border-2', 'border-blue-400');
    const move = handleChessMove(originalLocation, square);
    if (dragNodeRef.current && move) {
      dragNodeRef.current.remove();
      dragNodeRef.current = null;
    }
  };

  const handleHistoryItemClick = (historyItem: History, color: Color) => {
    const historySoFar = fullMoveHistory.slice(0, historyItem.moveNumber);
    chess.reset();

    for (const [index, historySoFarItem] of historySoFar.entries()) {
      chess.move(historySoFarItem.whiteMove.san);
      if (historySoFarItem.blackMove) {
        if (color === BLACK || index + 1 !== historyItem.moveNumber) {
          chess.move(historySoFarItem.blackMove.san);
        }
      }
    }

    setPieces(chess.board());
  };

  return (
    <div
      className='h-screen w-full flex flex-col font-sans'
      onDragOver={(event) => {
        event.preventDefault();
      }}
    >
      <h1 className='text-center py-8 font-[Chess_Sans]'>Chess Reviewer</h1>
      <div className='flex flex-1 min-h-0'>
        {/* Chess board */}
        <div className='flex relative items-center justify-center mb-12 ml-12 mr-6 min-h-0 min-w-0 flex-shrink-0'>
          <img
            src='/images/board.png'
            alt='Chess Board'
            className='block max-h-full max-w-full object-contain aspect-square'
          />
          {pieces.flat().map((piece, index) => {
            const left = (index % 8) * 12.5;
            const top = Math.floor(index / 8) * 12.5;
            const rank = 8 - Math.floor(index / 8);
            const file = String.fromCharCode('a'.charCodeAt(0) + (index % 8));
            const square = `${file}${rank}`;
            const imageName = piece ? `${piece.color}${piece.type}` : '';

            return piece ? (
              <img
                key={square}
                className='absolute h-[12.5%] w-[12.5%] cursor-grab pointer-events-auto'
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                }}
                draggable
                onDragStart={(event) => handleDragStart(event, square)}
                onDrag={(event) => handleDrag(event, square, imageName)}
                onDragEnd={handleDragEnd}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, square)}
                src={`/images/${imageName}.png`}
                alt={imageName}
              />
            ) : (
              <div
                key={square}
                className='absolute h-[12.5%] w-[12.5%]'
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, square)}
              />
            );
          })}
        </div>

        {/* Analysis */}
        <div className='flex-1 bg-gray-800 p-4 flex flex-col min-h-0'>
          <div className='flex mb-4 border-b border-gray-600'>
            <button
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'games'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('games')}
            >
              Games
            </button>
            <button
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'analysis'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
          </div>

          {activeTab === 'games' && (
            <div className='flex flex-col min-h-0 flex-1'>
              <h2 className='text-xl font-semibold mb-4'>Games</h2>

              <div className='mb-4 flex gap-2'>
                <input
                  type='text'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder='Enter your chess.com username'
                  className='flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-400'
                />
                <button
                  onClick={async () => {
                    const now = new Date();
                    const response = await fetch(
                      `https://api.chess.com/pub/player/${inputValue}/games/${now.getFullYear()}/${
                        now.getMonth() + 1
                      }`,
                    );
                    if (!response.ok) {
                      setFetchGamesError(
                        'Failed to fetch games. Please check the username and try again.',
                      );
                      return;
                    }

                    const data = (await response.json()) as {
                      games: ChessComGameReponse[];
                    };
                    setFetchedGames(data.games);
                    setInputValue(''); // Clear input after action
                  }}
                  className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
                >
                  Search
                </button>
              </div>
              {fetchGamesError && (
                <div className='text-red-500 mb-4'>{fetchGamesError}</div>
              )}
              <div className='flex-1 overflow-y-auto min-h-0'>
                {fetchedGames.map((game) => {
                  const eco = game.eco.split(/\d/)[0].split('/');
                  const opening = eco[eco.length - 1].replaceAll('-', ' ');

                  return (
                    <div
                      key={game.uuid}
                      className='mb-4 p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors flex items-center justify-between'
                      onClick={() => {
                        setSelectedGame(game);
                        setActiveTab('analysis');
                      }}
                    >
                      <div className='text-sm text-gray-300 flex-1'>
                        <div>
                          Game: {game.white.username} ({game.white.rating}) vs{' '}
                          {game.black.username} ({game.black.rating})
                        </div>
                        <div>Time Control: {game.time_control}</div>
                        <div>
                          Result:{' '}
                          {game.white.result === 'win'
                            ? `${game.white.username} wins`
                            : game.black.result === 'win'
                            ? `${game.black.username} wins`
                            : 'Draw'}
                        </div>
                        <div>
                          Opening:{' '}
                          <Link
                            href={game.eco}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-400 hover:underline'
                            onClick={(e) => e.stopPropagation()}
                          >
                            {opening}
                          </Link>
                        </div>
                        <div>
                          <Link
                            href={game.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-400 hover:underline'
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Game on Chess.com
                          </Link>
                        </div>
                      </div>
                      <div className='ml-4 text-gray-400'>
                        <svg
                          className='w-6 h-6'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 5l7 7-7 7'
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className='flex flex-col min-h-0 flex-1'>
              <h2 className='text-xl font-semibold mb-4'>Chess Analysis</h2>
              {selectedGame ? (
                <div className='flex-1 overflow-y-auto min-h-0'>
                  {fullMoveHistory.map((historyItem, index) => {
                    const isWhiteTurn = chess.turn() === WHITE;
                    const moveNumber = chess.moveNumber() - (isWhiteTurn ? 1 : 0);
                    const curMove = chess.history().at(-1);
                    const hightlightWhiteMove = !isWhiteTurn && moveNumber === historyItem.moveNumber && curMove === historyItem.whiteMove.san ? 'text-yellow-400' : '';
                    const highlightBlackMove = isWhiteTurn && moveNumber === historyItem.moveNumber && curMove === historyItem.blackMove?.san ? 'text-yellow-400' : '';

                    if (highlightBlackMove || hightlightWhiteMove) {
                      moveRefs.current[`move-${historyItem.moveNumber}`]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }

                    return (
                      <div
                        key={JSON.stringify(historyItem)}
                        className='text-gray-300 mb-1'
                        ref={(el) => {
                          moveRefs.current[`move-${historyItem.moveNumber}`] = el;
                        }}
                      >
                        {historyItem.moveNumber}
                        {')'}
                        <span
                          className={`hover:underline cursor-pointer font-[Chess_Sans] ml-2 ${hightlightWhiteMove}`}
                          onClick={() =>
                            handleHistoryItemClick(historyItem, WHITE)
                          }
                        >
                          {historyItem.whiteMove.san}
                        </span>{' '}
                        {historyItem.blackMove && (
                          <span
                            className={`hover:underline cursor-pointer font-[Chess_Sans] ml-2 ${highlightBlackMove}`}
                            onClick={() =>
                              handleHistoryItemClick(historyItem, BLACK)
                            }
                          >
                            {historyItem.blackMove.san}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className='text-gray-300'>
                  No game selected. Please select a game from the "Games" tab to
                  view its analysis.
                </p>
              )}
              {/* Control Buttons */}
              <div className='flex justify-center gap-2 mt-4 p-4 w-full border-t border-gray-600'>
                {/* First Move */}
                <button
                  className='px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
                  onClick={() => {
                    chess.reset();
                    moveRefs.current['move-1']?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    setPieces(chess.board());
                  }}
                >
                  <LeftStopChevron />
                </button>
                {/* Previous Move */}
                <button
                  className='px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
                  onClick={() => {
                    const curHistory = chess.history({ verbose: true });
                    chess.reset();
                    for (let i = 0; i < history.length; i++) {
                      if (curHistory[i]?.san !== history[i].san) {
                        break;
                      }
                      chess.move(history[i].san);
                    }
                    chess.undo();
                    setPieces(chess.board());
                  }}
                >
                  <LeftChevron />
                </button>
                {/* Next Move */}
                <button
                  className='px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
                  onClick={() => {
                    const curHistory = chess.history({ verbose: true });
                    chess.reset();
                    for (let i = 0; i < history.length; i++) {
                      if (curHistory[i]?.san !== history[i].san) {
                        chess.move(history[i].san);
                        break;
                      }
                      chess.move(history[i].san);
                    }
                    setPieces(chess.board());
                  }}
                >
                  <RightChevron />
                </button>
                {/* Last Move */}
                <button
                  className='px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
                  onClick={() => {
                    chess.reset();
                    for (const move of history) {
                      chess.move(move.san);
                    }
                    setPieces(chess.board());
                  }}
                >
                  <RightStopChevron />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessReview;
