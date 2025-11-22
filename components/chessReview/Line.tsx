interface LineProps {
  line: string[];
  fullMoveNumber: number;
  isWhiteNext: boolean;
}

export const Line = ({ line, fullMoveNumber, isWhiteNext }: LineProps) => {
  return (
    <div className='Line.tsx text-sm text-gray-400 mb-1'>
      {line
        .map(
          (m, i) =>
            `${
              i % 2 === (isWhiteNext ? 0 : 1)
                ? `${Math.floor(i / 2) + fullMoveNumber + 1}.`
                : i === 0
                ? `${Math.floor(i / 2) + fullMoveNumber + 1}...`
                : ''
            } ${m}`,
        )
        .join(' ')}
    </div>
  );
};

export default Line;
