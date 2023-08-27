import styled from '@emotion/styled';
import FlexContainer from '../common/FlexContainer';
import AboutMain from './AboutMain';
import AboutDescription from './AboutDescription';
import { NavItems } from '../../types';
import useNavIntersection from '../../hooks/useNavIntersection';

const Underline = styled.div`
  width: 140px;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.spicy};

  @keyframes glow {
    from { background-color: ${({ theme }) => theme.colors.spicy}; }
    to { background-color: ${({ theme }) => theme.colors.coolRanch}; }
  }
  animation: glow 1.5s infinite alternate;
`;

export const About = () => {
  const ref = useNavIntersection(.2, NavItems.About);

  return (
    <FlexContainer ref={ref} flexDirection='column' alignItems='center' fullWidth>
      <h1>{'ABOUT'}</h1>
      <Underline />
      <AboutMain />
      <AboutDescription />
    </FlexContainer>
  )
};

export default About;
