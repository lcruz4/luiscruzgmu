import styled from '@emotion/styled';
import FlexContainer from '../common/FlexContainer';
import AboutMain from './AboutMain';
import AboutDescription from './AboutDescription';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import useNavStore from '../../store/navStore';
import { NavItems } from '../../types';
import useNavIntersection from '../../hooks/useNavIntersection';

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
