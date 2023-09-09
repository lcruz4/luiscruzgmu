import FlexContainer from '../common/FlexContainer';
import FlexItem from '../common/FlexItem';
import { useInView } from 'react-intersection-observer';
import styled from '@emotion/styled';
import { DesktopOnly } from '../common/ResponsiveWrappers';

const AboutMainContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const AboutMain = () => {
  const { ref, inView } = useInView({
    threshold: .5,
  });

  return (
    <AboutMainContainer ref={ref}>
      <FlexContainer className='my-12 mx-0' flexDirection='column' alignItems='center' fullWidth>
        <DesktopOnly>
          <FlexContainer className='relative h-200 my-0 mx-24 mb-24' fullWidth>
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
              ...(inView ? [
                'bottom-0',
                'left-0'
              ] : [
                'left-[calc(50%-(230.938px/2))]',
                '-bottom-200',
                '-z-1'
              ])
            ].join(' ')}>
              <div className={`absolute -z-1 ${inView && 'spinAnimationReverse'}`}>
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
              ...(inView ? [
                'bottom-0',
                'right-0'
              ] : [
                'right-[calc(50%-(230.938px/2))]',
                '-bottom-200',
                '-z-1'
              ])
            ].join(' ')}>
              <div className={`absolute -z-1 ${inView && 'spinAnimation'}`}>
                <div className='hexagon' />
              </div>
              <div className='text-black text-shadowL shadow-white text-center w-[calc(230.938px)]'>
                DETAIL ORIENTED
              </div>
            </div>
          </FlexContainer>
        </DesktopOnly>
        <div className='relative tall:h-400 h-200 tall:w-[calc(461.875px)] w-[calc(461.875px/2)] grande:-my-200 mx-0 overflow-hidden'>
          <div className='absolute tall:h-800 h-400 -top-1/2 tall:left-[calc(61.875px/2)] left-[calc(61.875px/4)] overflow-hidden rotate-30'>
            <div className='tall:h-800 h-400 tall:w-400 w-200 overflow-hidden -rotate-60'>
                <img
                  className={[
                    'absolute',
                    'max-w-[unset]',
                    'top-1/4',
                    // edge width. point to point - 400
                    'tall:-left-[calc(61.875px/2)] -left-[calc(61.875px/4)]',
                    'tall:h-400 h-200',
                    // 400 / sin(60) to calculate hex point to point width
                    'tall:w-[calc(461.875px)] w-[calc(461.875px/2)]',
                    'object-cover',
                    'rotate-30',
                  ].join(' ')}
                  src='/images/profile.jpg'
                />
            </div>
          </div>
        </div>
        <DesktopOnly>
          <FlexContainer className='relative h-200 my-0 mx-24 mt-24' fullWidth>
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
              ...(inView ? [
                'top-0',
                'left-0'
              ] : [
                'left-[calc(50%-(230.938px/2))]',
                '-top-200',
                '-z-1'
              ])
            ].join(' ')}>
              <div className={`absolute -z-1 ${inView && 'spinAnimationReverse'}`}>
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
              ...(inView ? [
                'top-0',
                'right-0'
              ] : [
                'right-[calc(50%-(230.938px/2))]',
                '-top-200',
                '-z-1'
              ])
            ].join(' ')}>
              <div className={`absolute -z-1 ${inView && 'spinAnimation'}`}>
                <div className='hexagon' />
              </div>
              <div className='text-black text-shadowL shadow-white text-center w-[calc(230.938px)]'>
                OWNERSHIP
              </div>
            </div>
          </FlexContainer>
        </DesktopOnly>
      </FlexContainer>
    </AboutMainContainer>
  );
}

export default AboutMain;