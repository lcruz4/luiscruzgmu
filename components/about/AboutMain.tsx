import { useState } from 'react';
import FlexContainer from '../common/FlexContainer';
import FlexItem from '../common/FlexItem';

const AboutMain = () => {
  const [test, setTest] = useState(false);

  setTimeout(() => {
    setTest(true);
  }, 2000);

  return (
    <FlexContainer className='my-12 mx-0' flexDirection='column' alignItems='center' fullWidth>
      <FlexContainer className='relative h-200 my-0 mx-100 first-of-type:mb-100 last-of-type:mt-100' fullWidth>
        <div className={[
          'transition-all',
          'duration-1000',
          'ease-out',
          'absolute',
          'flex',
          'justify-center',
          'items-center',
          'h-200',
          // 200 / sin(60) to calculate hex point to point width
          'w-[230.938px]',
          ...(test ? [
            'bottom-0',
            'left-0'
          ] : [
            'left-[calc(50%-(230.938px/2))]',
            '-bottom-200',
            '-z-1'
          ])
        ].join(' ')}>
          <div className={`absolute -z-1 ${test && 'spinAnimationReverse'}`}>
            <div className='hexagon' />
          </div>
          <div className='text-black text-shadowL shadow-white text-center w-[calc(230.938px)]'>
            QUALITY
          </div>
        </div>
        <FlexItem flex='1 0 0'/>
        <div className={[
          'transition-all',
          'duration-1000',
          'ease-out',
          'absolute',
          'flex',
          'justify-center',
          'items-center',
          'h-200',
          // 200 / sin(60) to calculate hex point to point width
          'w-[230.938px]',
          ...(test ? [
            'bottom-0',
            'right-0'
          ] : [
            'right-[calc(50%-(230.938px/2))]',
            '-bottom-200',
            '-z-1'
          ])
        ].join(' ')}>
          <div className={`absolute -z-1 ${test && 'spinAnimation'}`}>
            <div className='hexagon' />
          </div>
          <div className='text-black text-shadowL shadow-white text-center w-[calc(230.938px)]'>
            DETAIL ORIENTED
          </div>
        </div>
      </FlexContainer>
      <div className='relative h-400 w-[calc(461.875px)] -my-200 mx-0 overflow-hidden'>
        <div className='absolute h-800 -top-1/2 left-[calc(61.875px/2)] overflow-hidden rotate-30'>
          <div className='h-800 w-400 overflow-hidden -rotate-60'>
              <img
                className={[
                  'absolute',
                  'max-w-[unset]',
                  'top-1/4',
                  // edge width. point to point - 400
                  '-left-[calc(61.875px/2)]',
                  'h-400',
                  // 400 / sin(60) to calculate hex point to point width
                  'w-[calc(461.875px)]',
                  'object-cover',
                  'rotate-30',
                ].join(' ')}
                src='/images/profile.jpg'
              />
          </div>
        </div>
      </div>
      <FlexContainer className='relative h-200 my-0 mx-24 first-of-type:mb-24 last-of-type:mt-24' fullWidth>
        <div className={[
          'transition-all',
          'duration-1000',
          'ease-out',
          'absolute',
          'flex',
          'justify-center',
          'items-center',
          'h-200',
          // 200 / sin(60) to calculate hex point to point width
          'w-[230.938px]',
          ...(test ? [
            'top-0',
            'left-0'
          ] : [
            'left-[calc(50%-(230.938px/2))]',
            '-top-200',
            '-z-1'
          ])
        ].join(' ')}>
          <div className={`absolute -z-1 ${test && 'spinAnimationReverse'}`}>
            <div className='hexagon' />
          </div>
          <div className='text-black text-shadowL shadow-white text-center w-[calc(230.938px)]'>
            COMMUNICATION
          </div>
        </div>
        <FlexItem flex='1 0 0'/>
        <div className={[
          'transition-all',
          'duration-1000',
          'ease-out',
          'absolute',
          'flex',
          'justify-center',
          'items-center',
          'h-200',
          // 200 / sin(60) to calculate hex point to point width
          'w-[230.938px]',
          ...(test ? [
            'top-0',
            'right-0'
          ] : [
            'right-[calc(50%-(230.938px/2))]',
            '-top-200',
            '-z-1'
          ])
        ].join(' ')}>
          <div className={`absolute -z-1 ${test && 'spinAnimation'}`}>
            <div className='hexagon' />
          </div>
          <div className='text-black text-shadowL shadow-white text-center w-[calc(230.938px)]'>
            OWNERSHIP
          </div>
        </div>
      </FlexContainer>
    </FlexContainer>
  );
}

export default AboutMain;