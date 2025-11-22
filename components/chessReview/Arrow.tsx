import { Move } from 'chess.js';
import KnightArrow, { KnightArrowTransform } from '../icons/KnightArrow';
import BasicArrow, { BasicArrowTransform } from '../icons/BasicArrow';

interface ArrowProps {
  bestMove: Move;
  top: number;
  left: number;
}

export const Arrow = ({ bestMove, top, left }: ArrowProps) => {
  const { from, to } = bestMove;
  const h = to.charCodeAt(0) - from.charCodeAt(0);
  const v = parseInt(to[1]) - parseInt(from[1]);
  const hMag = Math.abs(h);
  const vMag = Math.abs(v);
  let knightTransform: KnightArrowTransform = KnightArrowTransform.UPLEFT;
  let arrowTransform: BasicArrowTransform = BasicArrowTransform.UP;
  let factor = 1;
  let isKnightMove = false;

  if (hMag === 2 && vMag === 1) {
    isKnightMove = true;
    if (h < 0) {
      knightTransform =
        v < 0 ? KnightArrowTransform.LEFTDOWN : KnightArrowTransform.LEFTUP;
    } else {
      knightTransform =
        v < 0 ? KnightArrowTransform.RIGHTDOWN : KnightArrowTransform.RIGHTUP;
    }
  }

  if (hMag === 1 && vMag === 2) {
    isKnightMove = true;
    if (v < 0) {
      knightTransform =
        h < 0 ? KnightArrowTransform.DOWNLEFT : KnightArrowTransform.DOWNRIGHT;
    } else {
      knightTransform =
        h < 0 ? KnightArrowTransform.UPLEFT : KnightArrowTransform.UPRIGHT;
    }
  }

  if (h === 0) {
    factor = vMag;
    arrowTransform =
      v < 0 ? BasicArrowTransform.DOWN : BasicArrowTransform.UP;
  }

  if (v === 0) {
    factor = hMag;
    arrowTransform =
      h < 0 ? BasicArrowTransform.LEFT : BasicArrowTransform.RIGHT;
  }

  if (hMag === vMag) {
    factor = hMag;
    if (h < 0) {
      arrowTransform =
        v < 0 ? BasicArrowTransform.DOWNLEFT : BasicArrowTransform.UPLEFT;
    } else {
      arrowTransform =
        v < 0 ? BasicArrowTransform.DOWNRIGHT : BasicArrowTransform.UPRIGHT;
    }
  }

  return (
    <>
      {isKnightMove ? (
        <KnightArrow
          className='absolute h-[37.5%] w-[25%] z-2'
          style={{
            top: `${top - 25}%`,
            left: `${left - 12.5}%`,
          }}
          transform={knightTransform}
        />
      ) : (
        <BasicArrow
          factor={factor}
          transform={arrowTransform}
          className='absolute h-[12.5%] w-[12.5%] z-2'
          style={{
            top: `${top}%`,
            left: `${left}%`,
          }}
        />
      )}
    </>
  );
};
