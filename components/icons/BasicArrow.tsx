import { CSSProperties } from 'react';

export enum BasicArrowTransform {
  UP = '',
  UPRIGHT = 'rotate(45 50 50)',
  RIGHT = 'rotate(90 50 50)',
  DOWNRIGHT = 'rotate(135 50 50)',
  DOWN = 'rotate(180 50 50)',
  DOWNLEFT = 'rotate(225 50 50)',
  LEFT = 'rotate(270 50 50)',
  UPLEFT = 'rotate(315 50 50)',
}

interface BasicArrowProps {
  factor: number;
  transform: BasicArrowTransform;
  className?: string;
  style?: CSSProperties;
}

const BasicArrow = ({
  className,
  style,
  factor,
  transform,
}: BasicArrowProps) => {
  const isStraight =
    transform === BasicArrowTransform.UP ||
    transform === BasicArrowTransform.DOWN ||
    transform === BasicArrowTransform.LEFT ||
    transform === BasicArrowTransform.RIGHT;
  const diagonalShift = isStraight ? 0 : 40;
  const shift = diagonalShift + (100 + diagonalShift) * (factor - 1);

  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      xmlns='http://www.w3.org/2000/svg'
      version='1.1'
      style={style}
      overflow='visible'
    >
      <polygon
        transform={transform}
        points={`
          24.7 ${-13.6 - shift},
          50 ${-50 - shift},
          75.3 ${-13.6 - shift},
          60.9 ${-13.6 - shift},
          60.9 14.4,
          39.1 14.4,
          39.1 ${-13.6 - shift}
        `}
        style={{ fill: 'rgba(72, 193, 249, 0.8)', opacity: 0.8 }}
      ></polygon>
    </svg>
  );
};

export default BasicArrow;
