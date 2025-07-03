import { Dispatch, SetStateAction, useState } from 'react';

type Puzzle = (number | string)[][];
type PuzzleMeta = {
  tooFar?: boolean;
  complete: boolean;
  mass: number;
  edges: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}[][];

const MAX_DIM = 9;

/**
 * only called on numeric cells
 */
const setNumericCellMeta = (
  puzzle: Puzzle,
  y: number,
  x: number,
  meta: PuzzleMeta,
) => {
  if (meta[y][x].complete) {
    return;
  }
  const edges = {} as {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  let mass = 1;
  let yDelta = -1;
  let xDelta = 0;

  while (true) {
    let yWithDelta = y + yDelta;
    let xWithDelta = x + xDelta;
    const cell =
      isValidIndex(yWithDelta) && isValidIndex(xWithDelta)
        ? puzzle[yWithDelta][xWithDelta]
        : null;

    if (!isWhite(cell)) {
      if (yDelta < 0) {
        yDelta = 1;
        edges.top = yWithDelta + 1;
        continue;
      }
      if (yDelta > 0) {
        yDelta = 0;
        xDelta = -1;
        edges.bottom = yWithDelta - 1;
        continue;
      }
      if (xDelta < 0) {
        xDelta = 1;
        edges.left = xWithDelta + 1;
        continue;
      }
      edges.right = xWithDelta - 1;
      break;
    }

    yDelta === 0 ? 0 : yDelta < 0 ? yDelta-- : yDelta++;
    xDelta === 0 ? 0 : xDelta < 0 ? xDelta-- : xDelta++;
    mass++;
  }

  meta[y][x].mass = mass;
  meta[y][x].edges = edges;
  meta[y][x].complete = mass === puzzle[y][x];
};

const isWhite = (val: number | string | null) =>
  val === 'w' || typeof val === 'number';
const isValidIndex = (i: number) => !(i < 0 || i >= MAX_DIM);
const isWall = (puzzle: Puzzle, y: number, x: number) =>
  !(isValidIndex(x) && isValidIndex(y)) || puzzle[y][x] === 'b';

const isBlackInvalid = (
  puzzle: Puzzle,
  y: number,
  x: number,
  meta: PuzzleMeta,
) => {
  const top = y === 0 ? null : puzzle[y - 1][x];
  const right = x >= MAX_DIM - 1 ? null : puzzle[y][x + 1];
  const bottom = y >= MAX_DIM - 1 ? null : puzzle[y + 1][x];
  const left = x === 0 ? null : puzzle[y][x - 1];

  if (top === 'b' || right === 'b' || bottom === 'b' || left === 'b') {
    return true;
  }

  // if it's too far from any numeric cell then it's irrelevant and therefore
  // should never be black
  return isTooFar(puzzle, y, x, meta);
};

const isWhiteInvalid = (
  puzzle: Puzzle,
  y: number,
  x: number,
  meta: PuzzleMeta,
) => {
  let count = 1;
  let yDelta = -1;
  let xDelta = 0;
  let minCellVal = Infinity;
  let dir = 'v';
  let orthogonalMass = 0;

  while (true) {
    let yWithDelta = y + yDelta;
    let xWithDelta = x + xDelta;
    const cell =
      isValidIndex(yWithDelta) && isValidIndex(xWithDelta)
        ? puzzle[yWithDelta][xWithDelta]
        : null;

    if (typeof cell === 'number') {
      if (meta[yWithDelta][xWithDelta].complete) {
        return true;
      }
      const { top, right, left, bottom } = meta[yWithDelta][xWithDelta].edges;
      orthogonalMass = dir === 'v' ? right - left : bottom - top;
      minCellVal = Math.min(cell - orthogonalMass, minCellVal);
    }

    if (!isWhite(cell)) {
      if (yDelta < 0) {
        yDelta = 1;
        continue;
      }
      if (yDelta > 0) {
        count = 1;
        yDelta = 0;
        xDelta = -1;
        minCellVal = Infinity;
        dir = 'h';
        continue;
      }
      if (xDelta < 0) {
        xDelta = 1;
        continue;
      }
      break;
    }

    yDelta === 0 ? 0 : yDelta < 0 ? yDelta-- : yDelta++;
    xDelta === 0 ? 0 : xDelta < 0 ? xDelta-- : xDelta++;
    count++;

    if (minCellVal < count) {
      return true;
    }
  }

  return false;
};

const isTooFar = (puzzle: Puzzle, y: number, x: number, meta: PuzzleMeta) => {
  if (meta[y][x].tooFar !== undefined) {
    return meta[y][x].tooFar;
  }
  let tooFar = true;
  let yDelta = -1;
  let xDelta = 0;

  while (true) {
    let yWithDelta = y + yDelta;
    let xWithDelta = x + xDelta;

    const cell =
      isValidIndex(yWithDelta) && isValidIndex(xWithDelta)
        ? puzzle[yWithDelta][xWithDelta]
        : null;

    if (cell === null || typeof cell === 'number') {
      if (cell && Math.abs(yDelta) + Math.abs(xDelta) < cell) {
        tooFar = false;
        break;
      }
      if (yDelta < 0) {
        yDelta = 1;
        continue;
      }
      if (yDelta > 0) {
        yDelta = 0;
        xDelta = -1;
        continue;
      }
      if (xDelta < 0) {
        xDelta = 1;
        continue;
      }
      break;
    }

    yDelta === 0 ? 0 : yDelta < 0 ? yDelta-- : yDelta++;
    xDelta === 0 ? 0 : xDelta < 0 ? xDelta-- : xDelta++;
  }

  meta[y][x].tooFar = tooFar;
  return tooFar;
};

/**
 * should be called after meta has edges and mass.
 * should only be called on numeric cells.
 * Will modify puzzle if completable.
 * */
const finishCompletableNumber = (
  puzzle: Puzzle,
  y: number,
  x: number,
  meta: PuzzleMeta,
): 'error' | 'completed' | 'incomplete' => {
  const tWall = isWall(puzzle, meta[y][x].edges.top - 1, x);
  const rWall = isWall(puzzle, y, meta[y][x].edges.right + 1);
  const bWall = isWall(puzzle, meta[y][x].edges.bottom + 1, x);
  const lWall = isWall(puzzle, y, meta[y][x].edges.left - 1);
  const numWalls =
    (tWall ? 1 : 0) + (rWall ? 1 : 0) + (bWall ? 1 : 0) + (lWall ? 1 : 0);

  if (numWalls === 3) {
    let lastWallY = y;
    let lastWallX = x;

    while (meta[y][x].mass < (puzzle[y][x] as number)) {
      let yIndex = y;
      let xIndex = x;

      if (!tWall) {
        meta[y][x].edges.top--;
        yIndex = meta[y][x].edges.top;
        lastWallY = yIndex - 1;
      }
      if (!rWall) {
        meta[y][x].edges.right++;
        xIndex = meta[y][x].edges.right;
        lastWallX = xIndex + 1;
      }
      if (!bWall) {
        meta[y][x].edges.bottom++;
        yIndex = meta[y][x].edges.bottom;
        lastWallY = yIndex + 1;
      }
      if (!lWall) {
        meta[y][x].edges.left--;
        xIndex = meta[y][x].edges.left;
        lastWallX = xIndex - 1;
      }

      meta[y][x].mass++;
      if (!isWhite(puzzle[yIndex][xIndex])) {
        puzzle[yIndex][xIndex] = 'w';
      }
    }
    if (
      isValidIndex(lastWallY) &&
      isValidIndex(lastWallX)
    ) {
      const cell = puzzle[lastWallY][lastWallX];
      if (cell === '') {
        puzzle[lastWallY][lastWallX] = 'b';
      }
      if (isWhite(cell)) {
        return 'error';
      }
    }
    meta[y][x].complete = true;

    return 'completed';
  }

  return 'incomplete';
};

const solvePuzzle = (puzzle: Puzzle, meta: PuzzleMeta, updatePuzzle: () => void): boolean | null => {
  let puzzleUpdated = true;
  while (puzzleUpdated) {
    puzzleUpdated = false;
    for (const [y, row] of puzzle.entries()) {
      for (const [x, cell] of row.entries()) {
        if (typeof cell === 'number') {
          setNumericCellMeta(puzzle, y, x, meta);
        }
      }
    }
    for (const [y, row] of puzzle.entries()) {
      for (const [x, cell] of row.entries()) {
        if (typeof cell === 'number') {
          if (!meta[y][x].complete) {
            const status = finishCompletableNumber(puzzle, y, x, meta);
            if (status === 'error') {
              return false;
            }
            if (status === 'completed') {
              puzzleUpdated = true;
              updatePuzzle();
            }
          }
        }
        if (cell === '') {
          const blackInvalid = isBlackInvalid(puzzle, y, x, meta);
          const whiteInvalid = isWhiteInvalid(puzzle, y, x, meta);
          if (blackInvalid && whiteInvalid) {
            return false;
          }
          if (blackInvalid) {
            puzzle[y][x] = 'w';
            updatePuzzle();
            puzzleUpdated = true;
            continue;
          }

          if (whiteInvalid) {
            puzzle[y][x] = 'b';
            updatePuzzle();
            puzzleUpdated = true;
            continue;
          }
        }
      }
    }
  }
  if (!puzzle.flat().some((cell) => cell === '')) {
    return true;
  }
  for (const [y, row] of puzzle.entries()) {
    for (const [x, cell] of row.entries()) {
      if (cell === '') {
        const wPuzzle = puzzle.map((row) => [...row]);
        const bPuzzle = puzzle.map((row) => [...row]);
        const wMeta = meta.map((row) => [...row]);
        const bMeta = meta.map((row) => [...row]);
        wPuzzle[y][x] = 'w';
        bPuzzle[y][x] = 'b';

        const wSolved = solvePuzzle(wPuzzle, wMeta, () => {});
        const bSolved = solvePuzzle(bPuzzle, bMeta, () => {});

        if (wSolved) {
          puzzle.length = 0;
          puzzle.push(...wPuzzle);
          updatePuzzle();
          return true;
        }
        if (bSolved) {
          puzzle.length = 0;
          puzzle.push(...bPuzzle);
          updatePuzzle();
          return true;
        }
      }
    }
  }

  return false;
};

const Kuromasu = () => {
  const [error, setError] = useState('');
  const [test, setTest] = useState<Puzzle>([
    ['', '', '', '', '', '', 8, 5, 6],
    [6, 11, '', 8, '', '', '', '', 2],
    ['', '', '', 12, '', '', '', '', ''],
    ['', '', '', '', '', '', 4, '', 5],
    ['', 13, 6, 10, 8, 7, '', 2, ''],
    ['', '', '', 5, '', '', '', '', 5],
    [4, '', '', '', '', '', '', 3, ''],
    ['', '', 8, '', 8, '', '', '', 5],
    ['', '', '', 2, '', '', '', '', ''],
  ]);
  const [meta, setMeta] = useState(
    Array.from({ length: MAX_DIM }, () =>
      Array.from({ length: MAX_DIM }, () => ({})),
    ) as PuzzleMeta,
  );

  return (
    <div className='flex items-center justify-center h-screen w-screen bg-black text-neutral-800 font-["Futura"]'>
      <div className='flex flex-col items-center justify-center w-full max-w-3xl p-4'>
        <div className='bg-red-300 border-2 border-neutral-500'>
          {test.map((row, y) => (
            <div key={y} className='flex'>
              {row.map((cell, x) => (
                <div
                  key={x}
                  onClick={() => {
                    if (test[y][x] === 'w') {
                      setTest((test) => {
                        test[y][x] = 'b';
                        return [...test];
                      });
                    } else if (test[y][x] === 'b') {
                      setTest((test) => {
                        test[y][x] = '';
                        return [...test];
                      });
                    } else if (test[y][x] === '') {
                      setTest((test) => {
                        test[y][x] = 'w';
                        return [...test];
                      });
                    }
                  }}
                  className={`flex items-center justify-center w-10 h-10 ${
                    x === 0 ? '' : 'border-l'
                  } ${y === 0 ? '' : 'border-t'} border-neutral-500 ${
                    cell === ''
                      ? 'bg-stone-600'
                      : cell === 'b'
                      ? 'bg-black'
                      : 'bg-white'
                  } ${meta[y][x].complete ? 'text-stone-400' : 'text-black'} ${
                    typeof cell === 'number'
                      ? 'cursor-default'
                      : 'cursor-pointer'
                  } select-none`}
                >
                  {cell !== 0 && cell !== 'w' && cell !== 'b' && cell}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className='flex justify-around w-60 my-4'>
          <button
            onClick={() => {
              const isSolved = solvePuzzle(test, meta, () => setTest([...test]));
              if (isSolved === false) {
                setError('No solution found');
              }
            }}
            className='bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Solve
          </button>
          <button
            onClick={() => {
              setTest([
                ['', '', '', '', '', '', 8, 5, 6],
                [6, 11, '', 8, '', '', '', '', 2],
                ['', '', '', 12, '', '', '', '', ''],
                ['', '', '', '', '', '', 4, '', 5],
                ['', 13, 6, 10, 8, 7, '', 2, ''],
                ['', '', '', 5, '', '', '', '', 5],
                [4, '', '', '', '', '', '', 3, ''],
                ['', '', 8, '', 8, '', '', '', 5],
                ['', '', '', 2, '', '', '', '', ''],
              ]);
              setMeta(
                Array.from({ length: MAX_DIM }, () =>
                  Array.from({ length: MAX_DIM }, () => ({})),
                ) as PuzzleMeta,
              )
              setError('')
            }}
            className='bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Reset
          </button>
        </div>
        <div className='text-red-500'>{error}</div>
      </div>
    </div>
  );
};

export default Kuromasu;
