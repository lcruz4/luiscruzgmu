import { CSSProperties } from 'react';

export enum KnightArrowTransform {
  UPLEFT = '',
  UPRIGHT = 'scale(-1, 1) translate(-30, 0)',
  DOWNLEFT = 'rotate(180, 15, 25) scale(-1, 1) translate(-30, 0)',
  DOWNRIGHT = 'rotate(180, 15, 25)',
  LEFTUP = 'rotate(270, 15, 25) scale(-1, 1) translate(-30, 0)',
  LEFTDOWN = 'rotate(270, 15, 25)',
  RIGHTUP = 'rotate(90, 15, 25)',
  RIGHTDOWN = 'rotate(90, 15, 25) scale(-1, 1) translate(-30, 0)',
}

interface KnightArrowProps {
  className?: string;
  style?: CSSProperties;
  transform: KnightArrowTransform;
}

const KnightArrow = ({ className, style, transform }: KnightArrowProps) => {
  return (
    <svg
      className={`KnightArrow.tsx ${className ?? ''}`}
      viewBox='0 0 20 30'
      xmlns='http://www.w3.org/2000/svg'
      version='1.1'
      style={style}
      overflow='visible'
    >
      <polygon
        transform={transform}
        points='
          13.912 3.92,
          16.088 3.92,
          16.088 21.44,
          13.912 21.44,
          13.912 6.096,
          8.64 6.096,
          8.64 7.536,
          5 5,
          8.64 2.48,
          8.64 3.92
        '
        style={{ fill: 'rgba(72, 193, 249, 0.8)', opacity: 0.8 }}
      ></polygon>
    </svg>
  );
};

export default KnightArrow;
