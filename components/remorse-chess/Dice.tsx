// The die faces that give a trauma
export const Dice = ({ roll }: { roll: number[] }) => (
  <span className='flex gap-1'>
    {roll.map((n) => (
      <i
        key={n}
        className='grid size-[22px] place-items-center rounded-[5px] border-2 border-[#120d0b] bg-[#f7f3ea] text-xs font-bold text-[#120d0b] not-italic'
      >
        {n}
      </i>
    ))}
  </span>
);
