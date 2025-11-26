interface LineProps {
  line: string[];
  moveNumber: number;
  isWhiteNext: boolean;
}

export const Line = ({ line, moveNumber, isWhiteNext }: LineProps) => {
  return (
    <div className='Line.tsx text-sm text-gray-400 mb-1'>
      {line
        .map(
          (m, i) =>
            `${
              i % 2 === (isWhiteNext ? 1 : 0)
                ? `${Math.floor(i / 2) + moveNumber}.`
                : i === 0
                ? `${Math.floor(i / 2) + moveNumber}...`
                : ''
            } ${m}`,
        )
        .join(' ')}
    </div>
  );
};

export default Line;
