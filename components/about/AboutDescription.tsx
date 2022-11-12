import styled from '@emotion/styled';
import FlexContainer from '../common/FlexContainer';


const DescriptionContainer = styled(FlexContainer)(({ theme }) => `
width: 100vw;
background: ${theme.colors.white};
color: ${theme.colors.black};
`);

const Description = styled.div`
font-size: 1.25rem;
margin: 100px;

li {
  margin-bottom: 10px;
}
`;

const AboutDescription = () => (
  <DescriptionContainer fullWidth>
    <Description>
      <ul>
        <li>
          Quality is of the utmost importance to me. I don't cut corners and I strive to
          deliver the best solutions without sacrificing speed.
        </li>
        <li>
          Details matter. I notice things that often go unnoticed and I follow up to make sure
          appropriate action is taken to address those things. Often little details can end up
          having a big impact in the future.
        </li>
        <li>
          Strong communication is necessary for a functioning dev team. I always lead by
          example by fostering great communication within my team, and between teams as well.
          It's important that all team members feel psychological safety in order to share
          their ideas and arrive at the best solution.
        </li>
        <li>
          I take great pride in taking ownership of my work. I see through all of my projects
          until deployment and post deployment maintenance.
        </li>
      </ul>
    </Description>
  </DescriptionContainer>
);

export default AboutDescription;