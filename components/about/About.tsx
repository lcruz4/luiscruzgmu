import styled from '@emotion/styled';
import FlexContainer from '../common/FlexContainer';
import AboutMain from './AboutMain';
import AboutDescription from './AboutDescription';

const Underline = styled.div`
  width: 140px;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.white};

  @keyframes glow {
    from { background-color: ${({ theme }) => theme.colors.white}; }
    to { background-color: ${({ theme }) => theme.colors.halfSpicy}; }
  }
  animation: glow 1.5s infinite alternate;
`;

export const About = () => {
  return (
    <FlexContainer flexDirection='column' alignItems='center' fullWidth>
      <h1>ABOUT</h1>
      <Underline />
      <AboutMain />
      <AboutDescription />
    </FlexContainer>
  )
};

export default About;
