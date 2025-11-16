import { BLACK, Chess, Color, Move, WHITE } from 'chess.js';
import Link from 'next/link';
import { DragEvent, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LeftStopChevron,
  LeftChevron,
  RightChevron,
  RightStopChevron,
} from '../../components/icons';
import { Analysis, MoveClassification } from '../../types/chess';
import { Classification } from '../../components';
import Image from 'next/image';

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

interface AnalyzedMove extends Move {
  analysis?: Analysis;
}

interface FullMoveHistory {
  moveNumber: number;
  whiteMove: AnalyzedMove;
  blackMove?: AnalyzedMove;
}

const getClassificationColor = (
  classification: MoveClassification | undefined,
  type: 'bg' | 'text' = 'text',
) => {
  switch (classification) {
    case MoveClassification.BOOK:
      return `${type}-book`;
    case MoveClassification.BEST:
    case MoveClassification.EXCELLENT:
      return `${type}-best`;
    case MoveClassification.GOOD:
      return `${type}-good`;
    case MoveClassification.INACCURACY:
      return `${type}-inaccuracy`;
    case MoveClassification.MISTAKE:
      return `${type}-mistake`;
    case MoveClassification.BLUNDER:
      return `${type}-blunder`;
    default:
      return '';
  }
};

export const ChessReview = () => {
  const [pieces, setPieces] = useState(chess.board());
  const [activeTab, setActiveTab] = useState<'games' | 'analysis'>('games');
  const [inputValue, setInputValue] = useState('');
  const [fetchedGames, setFetchedGames] = useState<ChessComGameReponse[]>([]);
  const [fetchGamesError, setFetchGamesError] = useState('');
  const [selectedGame, setSelectedGame] = useState<ChessComGameReponse | null>(
    null,
  );
  const [fullMoveHistory, setFullMoveHistory] = useState<FullMoveHistory[]>([]);
  const [history, setHistory] = useState<AnalyzedMove[]>([]);
  const dragNodeRef = useRef<HTMLImageElement | null>(null);
  const dragLocationRef = useRef<{
    x: number;
    y: number;
    top: number;
    left: number;
  } | null>(null);
  const moveRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const pieceRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});

  let analysisQuery = useQuery<{ success: boolean; analysis: Analysis[] }>({
    queryKey: ['chess-review', selectedGame?.pgn],
    queryFn: async () => {
      if (!selectedGame) throw new Error('No game selected');
      const response = await fetch(
        `/api/chess-review?pgn=${encodeURIComponent(selectedGame.pgn)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      return response.json();
    },
    enabled: !!selectedGame,
  });

  const firstGameAnalysis = useQuery<{
    success: boolean;
    analysis: Analysis[];
  }>({
    queryKey: ['chess-review', fetchedGames[0]?.pgn],
    queryFn: async () => {
      if (fetchedGames.length === 0) throw new Error('No game fetched');
      const response = await fetch(
        `/api/chess-review?pgn=${encodeURIComponent(fetchedGames[0].pgn)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analysis for first game');
      }
      return response.json();
    },
    enabled: fetchedGames.length > 0,
  });

  if (!analysisQuery.isEnabled) {
    analysisQuery = firstGameAnalysis;
  }

  const whiteAvatar = useQuery<{ avatar: string }>({
    queryKey: ['chess-user', selectedGame?.white['@id']],
    queryFn: async () => {
      if (!selectedGame) throw new Error('No game selected');
      const response = await fetch(selectedGame.white['@id']);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!selectedGame,
  });

  const blackAvatar = useQuery<{ avatar: string }>({
    queryKey: ['chess-user', selectedGame?.black['@id']],
    queryFn: async () => {
      if (!selectedGame) throw new Error('No game selected');
      const response = await fetch(selectedGame.black['@id']);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!selectedGame,
  });

  useEffect(() => {
    if (selectedGame) {
      chess.loadPgn(selectedGame.pgn);
      const chessHistory = chess.history({ verbose: true });
      setHistory(chessHistory);
      const _history = chessHistory.reduce<FullMoveHistory[]>(
        (acc, move, index) => {
          if (index % 2 === 0) {
            const moveNumber = Math.ceil((index + 1) / 2);
            const blackMove = chessHistory.at(index + 1);

            acc.push({ moveNumber, whiteMove: move, blackMove });
          }
          return acc;
        },
        [],
      );
      setFullMoveHistory(_history);
      chess.reset();
      setPieces(chess.board());
    }
  }, [selectedGame]);

  useEffect(() => {
    if (analysisQuery.data?.success && !history.at(0)?.analysis) {
      const analyzedHistory = history.map((move, index) => {
        const analyzedMove = move as AnalyzedMove;
        analyzedMove.analysis = analysisQuery.data?.analysis[index];
        return analyzedMove;
      });
      setHistory(analyzedHistory);

      const _history = history.reduce<FullMoveHistory[]>((acc, move, index) => {
        if (index % 2 === 0) {
          const moveNumber = Math.ceil((index + 1) / 2);
          const blackMove = history.at(index + 1);
          acc.push({ moveNumber, whiteMove: move, blackMove });
        }
        return acc;
      }, []);
      setFullMoveHistory(_history);
    }
  }, [analysisQuery.data, history]);

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

  const handleHistoryItemClick = (
    historyItem: FullMoveHistory,
    color: Color,
  ) => {
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
      className='h-screen w-full flex flex-col font-[Chess_Sans]'
      onDragOver={(event) => {
        event.preventDefault();
      }}
    >
      <h1 className='text-center py-8'>Chess Reviewer</h1>
      <div className='flex flex-1 min-h-0'>
        {/* Chess board */}
        <div className='flex relative items-center justify-center my-12 ml-12 mr-6 min-h-0 min-w-0 flex-shrink-0'>
          <div className='absolute top-[-48px] left-0 h-12 flex flex-row gap-2'>
            <Image
              src={whiteAvatar.data?.avatar ?? '/images/wk.png'}
              alt={selectedGame?.white.username ?? 'White Player'}
              className='h-12 w-12 rounded-md object-cover'
              width={48}
              height={48}
            />
            <p className='text-white text-sm text-center mt-1'>
              {`${selectedGame?.white.username}`}{' '}
              <span className='font-sans'>{`(${selectedGame?.white.rating})`}</span>
            </p>
          </div>
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
            const annotationTop =
              Math.floor(index / 8) * 12.5 - 6.25 * (rank === 8 ? -1 : 1);
            const annotationLeft =
              (index % 8) * 12.5 + 6.25 * (file === 'h' ? -1 : 1);
            const square = `${file}${rank}`;
            const imageName = piece ? `${piece.color}${piece.type}` : '';
            const lastMove = chess.history({ verbose: true }).at(-1);
            const moveIndex = chess.history().length - 1;
            const isHighlightSquare =
              lastMove?.from === square || lastMove?.to === square;
            const classification =
              history[moveIndex]?.analysis?.classificationLichessFormula;
            const highlightColor = isHighlightSquare
              ? getClassificationColor(classification, 'bg')
              : '';

            return (
              <>
                {piece ? (
                  <img
                    key={`${square}_${imageName}`}
                    ref={(el) =>
                      (pieceRefs.current[`${square}_${imageName}`] = el)
                    }
                    className={`${square}_${imageName} absolute h-[12.5%] w-[12.5%] cursor-grab pointer-events-auto z-1`}
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
                ) : null}
                <div
                  key={`${square}_highlight`}
                  className={`${square}_highlight absolute h-[12.5%] w-[12.5%] opacity-50 ${highlightColor}`}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                  }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(event) => handleDrop(event, square)}
                />
                {classification && lastMove?.to === square && (
                  <div
                    key={`${square}_annotation`}
                    className={`${square}_annotation absolute h-[12.5%] w-[12.5%] z-2 justify-center items-center flex`}
                    style={{
                      top: `${annotationTop}%`,
                      left: `${annotationLeft}%`,
                    }}
                  >
                    <div className='h-[40%] w-[40%]'>
                      <Classification classification={classification} />
                    </div>
                  </div>
                )}
              </>
            );
          })}
          <div className='absolute bottom-[-48px] right-0 h-12 flex flex-row gap-2'>
            <p className='text-white text-sm text-center mt-1'>
              {`${selectedGame?.black.username}`}{' '}
              <span className='font-sans'>{`(${selectedGame?.black.rating})`}</span>
            </p>
            <Image
              src={blackAvatar.data?.avatar ?? '/images/bk.png'}
              alt={selectedGame?.black.username ?? 'Black Player'}
              className='h-12 w-12 rounded-md object-cover'
              width={48}
              height={48}
            />
          </div>
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

              <div className='font-sans flex-1 overflow-y-auto min-h-0'>
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
                      data.games.sort((a, b) => b.end_time - a.end_time);
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
                <div>
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
                          <div>Time Control: {`${game.time_class} (${game.time_control})`}</div>
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
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className='flex flex-col min-h-0 flex-1'>
              <h2 className='text-xl font-semibold mb-4'>Chess Analysis</h2>
              <div className='flex-1 overflow-y-auto min-h-0 font-sans'>
                {selectedGame ? (
                  <div>
                    {fullMoveHistory.map((historyItem, index) => {
                      const isWhiteTurn = chess.turn() === WHITE;
                      const moveNumber =
                        chess.moveNumber() - (isWhiteTurn ? 1 : 0);
                      const curMove = chess.history().at(-1);
                      const whiteClassification =
                        historyItem.whiteMove.analysis
                          ?.classificationLichessFormula;
                      const blackClassification =
                        historyItem.blackMove?.analysis
                          ?.classificationLichessFormula;
                      const hightlightWhiteMove =
                        !isWhiteTurn &&
                        moveNumber === historyItem.moveNumber &&
                        curMove === historyItem.whiteMove.san
                          ? getClassificationColor(whiteClassification)
                          : '';
                      const highlightBlackMove =
                        isWhiteTurn &&
                        moveNumber === historyItem.moveNumber &&
                        curMove === historyItem.blackMove?.san
                          ? getClassificationColor(blackClassification)
                          : '';

                      if (highlightBlackMove || hightlightWhiteMove) {
                        moveRefs.current[
                          `move-${historyItem.moveNumber}`
                        ]?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'nearest',
                        });
                      }

                      return (
                        <div
                          key={JSON.stringify(historyItem)}
                          className='text-gray-300 mb-1'
                          ref={(el) => {
                            moveRefs.current[`move-${historyItem.moveNumber}`] =
                              el;
                          }}
                        >
                          {historyItem.moveNumber}
                          {')'}
                          <span
                            className={`hover:underline cursor-pointer ml-2 font-bold ${hightlightWhiteMove}`}
                            onClick={() =>
                              handleHistoryItemClick(historyItem, WHITE)
                            }
                          >
                            {historyItem.whiteMove.san}{' '}
                            {whiteClassification && (
                              <div className='max-h-4 max-w-4 inline-block'>
                                <Classification
                                  classification={whiteClassification}
                                />
                              </div>
                            )}
                          </span>{' '}
                          {historyItem.blackMove && (
                            <span
                              className={`hover:underline cursor-pointer ml-2 font-bold ${highlightBlackMove}`}
                              onClick={() =>
                                handleHistoryItemClick(historyItem, BLACK)
                              }
                            >
                              {historyItem.blackMove.san}{' '}
                              {blackClassification && (
                                <div className='max-h-4 max-w-4 inline-block'>
                                  <Classification
                                    classification={blackClassification}
                                  />
                                </div>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className='text-gray-300'>
                    No game selected. Please select a game from the "Games" tab
                    to view its analysis.
                  </p>
                )}
              </div>
              {/* Control Buttons */}
              <div className='flex justify-center gap-3 mt-4 p-4 w-full border-t border-gray-600'>
                {/* First Move */}
                <button
                  className='px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
                  onClick={() => {
                    chess.reset();
                    moveRefs.current['move-1']?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                    });
                    setPieces(chess.board());
                  }}
                >
                  <LeftStopChevron />
                </button>
                {/* Previous Move */}
                <button
                  className='px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
                  onClick={() => {
                    chess.undo();
                    setPieces(chess.board());
                  }}
                >
                  <LeftChevron />
                </button>
                {/* Next Move */}
                <button
                  className='px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
                  onClick={() => {
                    const curHistory = chess.history({ verbose: true });
                    let dirtyHistory = false;
                    let i = curHistory.length - 1;
                    for (i; i >= 0; i--) {
                      if (curHistory[i]?.san !== history[i].san) {
                        chess.undo();
                        dirtyHistory = true;
                      } else {
                        break;
                      }
                    }
                    const nextMove = history.at(i + 1);
                    if (nextMove) {
                      const imgRef =
                        pieceRefs.current[
                          `${nextMove.from}_${nextMove.color}${nextMove.piece}`
                        ];
                      chess.move(nextMove.san);
                      if (imgRef && !dirtyHistory) {
                        const hMove =
                          nextMove.to[0].charCodeAt(0) -
                          nextMove.from[0].charCodeAt(0);
                        const vMove =
                          parseInt(nextMove.to[1]) - parseInt(nextMove.from[1]);
                        const top =
                          imgRef.offsetTop - vMove * imgRef.offsetHeight;
                        const left =
                          imgRef.offsetLeft + hMove * imgRef.offsetWidth;
                        imgRef.classList.add(
                          'transition-all',
                          'duration-200',
                          'ease-out',
                          'z-10',
                        );
                        imgRef.style.top = `${top}px`;
                        imgRef.style.left = `${left}px`;
                        setTimeout(() => {
                          imgRef.classList.remove(
                            'transition-all',
                            'duration-200',
                            'ease-out',
                            'z-10',
                          );
                          setPieces(chess.board());
                        }, 200);
                      } else {
                        setPieces(chess.board());
                      }
                    }
                  }}
                >
                  <RightChevron />
                </button>
                {/* Last Move */}
                <button
                  className='px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
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
