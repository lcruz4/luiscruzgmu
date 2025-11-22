import { Chess, Move } from 'chess.js';
import {
  LeftChevron,
  LeftStopChevron,
  RightChevron,
  RightStopChevron,
} from '../icons';
import { AnalyzedMove } from '../../types/chess';
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef } from 'react';
import { findLastMatchingMoveIndex } from '../../helpers/chess';

interface ControlsProps {
  chess: Chess;
  history: AnalyzedMove[];
  lastMoveRef: MutableRefObject<Move | undefined>;
  setPieces: Dispatch<SetStateAction<ReturnType<Chess['board']>>>;
}

let i = 0;

export const Controls = ({
  chess,
  history,
  lastMoveRef,
  setPieces,
}: ControlsProps) => {
  const pieceSizeRef = useRef<number>();

  useEffect(() => {
    const handleResize = () => {
      pieceSizeRef.current = document.getElementById('a1')?.offsetHeight;
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className='Controls.tsx flex justify-center gap-3 mt-4 p-4 w-full border-t border-gray-600'>
      {/* First Move */}
      <button
        className='px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
        onClick={() => {
          chess.reset();
          lastMoveRef.current = undefined;
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
          lastMoveRef.current = chess.undo() || undefined;
          if (lastMoveRef.current) chess.move(lastMoveRef.current.san);
          setPieces(chess.board());
        }}
      >
        <LeftChevron />
      </button>
      {/* Next Move */}
      <button
        className='px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center cursor-pointer'
        onClick={() => {
          const { dirtyHistory, index } = findLastMatchingMoveIndex(
            chess,
            history,
            lastMoveRef,
          );
          const nextMove = history.at(index + 1);
          if (nextMove) {
            const imgElement = document.getElementById(`${nextMove.from}_${nextMove.color}${nextMove.piece}`);
            lastMoveRef.current = chess.move(nextMove.san);

            if (imgElement && !dirtyHistory) {
              const hMove =
                nextMove.to[0].charCodeAt(0) - nextMove.from[0].charCodeAt(0);
              const vMove =
                parseInt(nextMove.to[1]) - parseInt(nextMove.from[1]);
              const translateX = -vMove * pieceSizeRef.current!;
              const translateY = hMove * pieceSizeRef.current!;

              imgElement.classList.add(
                'transition-all',
                'duration-200',
                'ease-out',
                'z-10',
              );
              imgElement.style.translate = `${translateY}px ${translateX}px`;
              setTimeout(() => {
                imgElement.classList.remove(
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
          const { index } = findLastMatchingMoveIndex(
            chess,
            history,
            lastMoveRef,
          );
          for (const nextMove of history.slice(index + 1)) {
            lastMoveRef.current = chess.move(nextMove.san);
          }
          setPieces(chess.board());
        }}
      >
        <RightStopChevron />
      </button>
    </div>
  );
};
