import FlexContainer from '../common/FlexContainer';
import FlexItem from '../common/FlexItem';

const AboutMain = () => (
  <FlexContainer className='my-12 mx-0' flexDirection='column' alignItems='center' fullWidth>
    <FlexContainer className='my-0 mx-100 first-of-type:mb-100 last-of-type:mt-100' fullWidth>
      <div className='flex justify-center items-center h-200 w-[calc(200px/0.86602540378)]'>
        <div className='absolute -z-1 spinAnimation gradie'>
          <div className='hexagon' />
        </div>
        <div className='text-black text-shadowL shadow-white text-center w-[calc(200px/0.86602540378)]'>
          QUALITY
        </div>
      </div>
      <FlexItem flex='1 0 0'/>
      <div className='flex justify-center items-center h-200 w-[calc(200px/0.86602540378)]'>
        <div className='absolute -z-1 spinAnimation'>
          <div className='hexagon' />
        </div>
        <div className='text-black text-shadowL shadow-white text-center w-[calc(200px/0.86602540378)]'>
          DETAIL ORIENTED
        </div>
      </div>
    </FlexContainer>
    <div className='relative h-400 w-[calc(400px/0.86602540378)] -my-200 mx-0 overflow-hidden'>
      <div className='absolute h-800 -top-1/2 left-[calc(((400px/0.86602540378)-400px)/2)] overflow-hidden rotate-30'>
        <div className='h-800 w-400 overflow-hidden -rotate-60'>
            <img
              className='absolute max-w-[unset] top-1/4 -left-[calc(((400px/0.86602540378)-400px)/2)] h-400 w-[calc(400px/0.86602540378)] object-cover rotate-30'
              src='/images/profile.jpg'
            />
        </div>
      </div>
    </div>
    <FlexContainer className='my-0 mx-24 first-of-type:mb-24 last-of-type:mt-24' fullWidth>
      <div className='flex justify-center items-center h-200 w-[calc(200px/0.86602540378)]'>
        <div className='absolute -z-1 spinAnimation'>
          <div className='hexagon' />
        </div>
        <div className='text-black text-shadowL shadow-white text-center w-[calc(200px/0.86602540378)]'>
          COMMUNICATION
        </div>
      </div>
      <FlexItem flex='1 0 0'/>
      <div className='flex justify-center items-center h-200 w-[calc(200px/0.86602540378)]'>
        <div className='absolute -z-1 spinAnimation'>
          <div className='hexagon' />
        </div>
        <div className='text-black text-shadowL shadow-white text-center w-[calc(200px/0.86602540378)]'>
          OWNERSHIP
        </div>
      </div>
    </FlexContainer>
  </FlexContainer>
);

export default AboutMain;