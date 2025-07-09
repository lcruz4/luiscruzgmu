import Head from 'next/head';
import { DragEventHandler, useState } from 'react';

let recurseCount = 0;
const debug = false;

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
  availableSpace: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}[][];
type Direction = 'top' | 'right' | 'bottom' | 'left';

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

  // find edges and mass
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

  yDelta = -1;
  xDelta = 0;
  let edgeY = edges.top;
  let edgeX = x;
  let space = y - edgeY;
  const availableSpace = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  while (true) {
    let yWithDelta = edgeY + yDelta;
    let xWithDelta = edgeX + xDelta;

    if (isWall(puzzle, yWithDelta, xWithDelta)) {
      if (yDelta < 0) {
        yDelta = 1;
        edgeY = edges.bottom;
        availableSpace.top = space;
        space = edgeY - y;
        continue;
      }
      if (yDelta > 0) {
        yDelta = 0;
        xDelta = -1;
        edgeY = y;
        edgeX = edges.left;
        availableSpace.bottom = space;
        space = x - edgeX;
        continue;
      }
      if (xDelta < 0) {
        xDelta = 1;
        edgeX = edges.right;
        availableSpace.left = space;
        space = edgeX - x;
        continue;
      }
      availableSpace.right = space;
      break;
    }

    yDelta === 0 ? 0 : yDelta < 0 ? yDelta-- : yDelta++;
    xDelta === 0 ? 0 : xDelta < 0 ? xDelta-- : xDelta++;
    space++;
  }

  meta[y][x].mass = mass;
  meta[y][x].complete = mass === puzzle[y][x];
  meta[y][x].edges = edges;
  meta[y][x].availableSpace = availableSpace;
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
 * should be called after setNumericCellMeta.
 * should only be called on numeric cells.
 * Will modify puzzle if completable.
 */
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
      if (!isValidIndex(yIndex) || !isValidIndex(xIndex)) {
        return 'error';
      }
      if (!isWhite(puzzle[yIndex][xIndex])) {
        puzzle[yIndex][xIndex] = 'w';
      }
    }
    if (isValidIndex(lastWallY) && isValidIndex(lastWallX)) {
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

/**
 * should be called after meta is setNumericCellMeta.
 * should only be called on numeric cells.
 * should only be called if the cell is not complete.
 * Will modify puzzle if solvable space is found.
 */
const fillSolvableSpace = (
  puzzle: Puzzle,
  y: number,
  x: number,
  meta: PuzzleMeta,
): 'error' | 'updated' | 'noUpdate' => {
  const cell = puzzle[y][x] as number;
  const sortedSpaces = Object.entries(meta[y][x].availableSpace).sort(
    ([, a], [, b]) => b - a,
  );
  const total = sortedSpaces.reduce((acc, [, space]) => acc + space, 0);
  let updated = false;

  for (const [dir, space] of sortedSpaces) {
    const otherDirsTotal = total - space;
    const diff = cell - otherDirsTotal - 1;

    if (diff > 0) {
      for (let i = 1; i <= diff; i++) {
        let yWithDelta = dir === 'top' ? y - i : dir === 'bottom' ? y + i : y;
        let xWithDelta = dir === 'left' ? x - i : dir === 'right' ? x + i : x;
        if (
          !isValidIndex(yWithDelta) ||
          !isValidIndex(xWithDelta) ||
          isWall(puzzle, yWithDelta, xWithDelta)
        ) {
          return 'error';
        }

        if (puzzle[yWithDelta][xWithDelta] === '') {
          puzzle[yWithDelta][xWithDelta] = 'w';
          meta[y][x].edges[dir as Direction]++;
          meta[y][x].mass++;
          updated = true;
        }
      }
    }
  }

  meta[y][x].complete = meta[y][x].mass === cell;
  return updated ? 'updated' : 'noUpdate';
};

const solvePuzzle = (
  puzzle: Puzzle,
  meta: PuzzleMeta,
  updatePuzzle: () => void,
): boolean | null => {
  recurseCount++;
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
          if (!meta[y][x].complete) {
            const status = fillSolvableSpace(puzzle, y, x, meta);
            if (status === 'error') {
              return false;
            }
            if (status === 'updated') {
              puzzleUpdated = true;
              updatePuzzle();
            }
          }
        } else if (cell === '') {
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
    if (debug && puzzleUpdated) {
      return null;
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
        const wMeta = meta.map((row) => row.map(() => ({}))) as PuzzleMeta;
        const bMeta = meta.map((row) => row.map(() => ({}))) as PuzzleMeta;
        wPuzzle[y][x] = 'w';
        bPuzzle[y][x] = 'b';

        let wSolved = null;
        let bSolved = null;
        while (wSolved === null) {
          wSolved = solvePuzzle(wPuzzle, wMeta, () => {});
        }
        if (wSolved) {
          puzzle.length = 0;
          puzzle.push(...wPuzzle);
          updatePuzzle();
          return true;
        }
        while (bSolved === null) {
          bSolved = solvePuzzle(bPuzzle, bMeta, () => {});
        }
        if (bSolved) {
          puzzle.length = 0;
          puzzle.push(...bPuzzle);
          updatePuzzle();
          return true;
        }
        return false;
      }
    }
  }

  return false;
};

const Kuromasu = () => {
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [puzzle, setPuzzle] = useState<Puzzle>([
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
  ]);
  const [meta, setMeta] = useState(
    Array.from({ length: MAX_DIM }, () =>
      Array.from({ length: MAX_DIM }, () => ({})),
    ) as PuzzleMeta,
  );
  const [dragVal, setDragVal] = useState('');
  const [dragClassname, setDragClassname] = useState('');

  const handleDragOver: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (e.currentTarget.getAttribute('data-was') === null) {
      e.currentTarget.setAttribute('data-was', e.currentTarget.innerHTML);
    }
    if (e.currentTarget.getAttribute('data-class-was') === null) {
      e.currentTarget.setAttribute('data-class-was', e.currentTarget.className);
    }
    e.currentTarget.innerHTML = dragVal?.toString() ?? '';
    e.currentTarget.classList.remove('bg-stone-600', 'bg-white', 'bg-black');
    e.currentTarget.classList.add(...dragClassname.split(' '));
  };

  const handleDragLeave: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.currentTarget.innerHTML = e.currentTarget.getAttribute('data-was') ?? '';
    e.currentTarget.className =
      e.currentTarget.getAttribute('data-class-was') ?? '';
    e.currentTarget.removeAttribute('data-was');
    e.currentTarget.removeAttribute('data-class-was');
  };

  const handleDrop: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.currentTarget.removeAttribute('data-was');
    e.currentTarget.removeAttribute('data-class-was');
    const x = parseInt(e.currentTarget.getAttribute('data-x')!);
    const y = parseInt(e.currentTarget.getAttribute('data-y')!);
    puzzle[y][x] = parseInt(dragVal);
    setPuzzle([...puzzle]);
  };

  return (
    <>
      <Head>
        <title>Luis Cruz | Kuromasu Solver</title>
        <link rel='icon' href='/images/kuromasu.ico' type='image/gif' />
        <style>
          {`
          html, body {
            overscroll-behavior: none !important;
          }
        `}
        </style>
      </Head>
      <div className='flex items-center justify-center h-screen w-screen bg-black text-neutral-800 font-["Futura"]'>
        <div className='flex flex-col items-center justify-center w-full max-w-3xl p-4'>
          {editMode && (
            <div className='flex border-2 border-neutral-500 mb-8 max-w-[364px] flex-wrap'>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(
                (v, i) => (
                  <div
                    key={`blocks-${i}`}
                    draggable
                    onDragStart={() => {
                      setDragVal(v.toString());
                      setDragClassname('bg-white text-black');
                    }}
                    className={`flex items-center justify-center w-10 h-10 border border-neutral-500 bg-white text-black cursor-pointer select-none`}
                  >
                    {v}
                  </div>
                ),
              )}
            </div>
          )}
          <div className='bg-red-300 border-2 border-neutral-500'>
            {puzzle.map((row, y) => (
              <div key={`y-${y}`} className='flex'>
                {row.map((cell, x) => (
                  <div
                    key={`y-${y},x-${x}`}
                    data-x={x}
                    data-y={y}
                    onClick={() => {
                      if (!editMode) {
                        return;
                      }
                      if (puzzle[y][x] === 'w') {
                        setPuzzle((puzzle) => {
                          puzzle[y][x] = 'b';
                          return [...puzzle];
                        });
                      } else if (puzzle[y][x] === 'b') {
                        setPuzzle((puzzle) => {
                          puzzle[y][x] = '';
                          return [...puzzle];
                        });
                      } else if (puzzle[y][x] === '') {
                        setPuzzle((puzzle) => {
                          puzzle[y][x] = 'w';
                          return [...puzzle];
                        });
                      } else {
                        setPuzzle((puzzle) => {
                          puzzle[y][x] = '';
                          return [...puzzle];
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
                    } ${
                      meta[y][x].complete ? 'text-stone-400' : 'text-black'
                    } ${
                      typeof cell === 'number'
                        ? 'cursor-default'
                        : 'cursor-pointer'
                    } select-none`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {cell !== '' && cell !== 'w' && cell !== 'b' && cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className='flex justify-around w-60 my-4'>
            <button
              onClick={() => {
                if (editMode) {
                  setEditMode(false);
                  return;
                }
                const t = performance.now();
                const isSolved = solvePuzzle(puzzle, meta, () =>
                  setPuzzle([...puzzle]),
                );
                console.log('Elapsed time:', performance.now() - t);
                console.log('Recurse count:', recurseCount);
                recurseCount = 0;
                if (isSolved === false) {
                  setError('No solution found');
                }
              }}
              className='bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
            >
              {editMode ? 'Save' : 'Solve'}
            </button>
            <button
              onClick={() => {
                if (!editMode) {
                  setEditMode(true);
                  return;
                }
                setPuzzle([
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                ]);
                setMeta(
                  Array.from({ length: MAX_DIM }, () =>
                    Array.from({ length: MAX_DIM }, () => ({})),
                  ) as PuzzleMeta,
                );
                setError('');
              }}
              className='bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
            >
              {editMode ? 'Reset' : 'Edit'}
            </button>
          </div>
          <div className='text-red-500'>{error}</div>
        </div>
      </div>
    </>
  );
};

export default Kuromasu;
