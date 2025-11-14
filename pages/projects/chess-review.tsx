import { Chess } from 'chess.js';
import { useState } from 'react';
const chess = new Chess();

export const ChessReview = () => {
  const [pieces, setPieces] = useState(chess.board());
  const history = chess.history({ verbose: true });
  const formattedHistory = history.reduce<string[]>((acc, move, index) => {
    if (index % 2 === 0) {
      const moveNumber = Math.ceil((index + 1) / 2);
      const whiteMove = move.san;
      const blackMove = history[index + 1]?.san ?? '';
      acc.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    }
    return acc;
  }, []);

  return (
    <div className='h-screen w-full flex flex-col'>
      <h1 className='text-center py-8'>Chess Reviewer</h1>
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
                className={`absolute h-[12.5%] w-[12.5%]`}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                }}
                draggable
                src={`/images/${imageName}.png`}
                alt={imageName}
              />
            ) : null;
          })}
        </div>

        {/* Analysis */}
        <div className='flex-1 bg-gray-800 p-4'>
          <h2 className='text-xl font-semibold mb-4'>Chess Analysis</h2>
          <p>Your chess analysis content goes here...</p>
          <input id='moveInput' type='text' placeholder='move' className='mt-4 p-2 w-full rounded' />
          <button
            className='mt-4 p-2 w-full bg-blue-600 text-white rounded hover:bg-blue-700'
            onClick={() => {
              const moveInput = document.getElementById('moveInput') as HTMLInputElement;
              if (moveInput) {
                chess.move(moveInput.value);
                setPieces(chess.board());
              }
            }}
          >
            Make Move
          </button>
          {formattedHistory.map((move, index) => (
            <div key={index}>{move}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessReview;
