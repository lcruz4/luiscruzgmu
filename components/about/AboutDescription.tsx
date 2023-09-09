import FlexContainer from '../common/FlexContainer';

const Li = (props) => <li className='mb-4' {...props}>{props.children}</li>;

const AboutDescription = () => (
  <FlexContainer fullWidth className='w-screen bg-white text-black'>
    <div className='text-xl m-24 max-grande:m-16 max-tall:m-8'>
      <ul>
        <Li>
          Quality is of the utmost importance to me. I don't cut corners and I strive to
          deliver the best solutions without sacrificing speed.
        </Li>
        <Li>
          Details matter. I notice things that often go unnoticed and I follow up to make sure
          appropriate action is taken to address those things. Often little details can end up
          having a big impact in the future.
        </Li>
        <Li>
          Strong communication is necessary for a functioning dev team. I always lead by
          example by fostering great communication within my team, and between teams as well.
          It's important that all team members feel psychological safety in order to share
          their ideas and arrive at the best solution.
        </Li>
        <Li>
          I take great pride in taking ownership of my work. I see through all of my projects
          until deployment and post deployment maintenance.
        </Li>
      </ul>
    </div>
  </FlexContainer>
);

export default AboutDescription;