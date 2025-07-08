import styled from '@emotion/styled';
import FlexContainer from '../common/FlexContainer';
import { NavItems } from '../../types';
import useNavIntersection from '../../hooks/useNavIntersection';

const StylishContainer = styled(FlexContainer)`
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-image: url('/images/background.jpg');
`;

export const HomeHero = ({ children }: { children: React.ReactNode }) => {
  const ref = useNavIntersection(.1, NavItems.Home);

  return <StylishContainer ref={ref} justifyContent='center' alignItems='center'>{children}</StylishContainer>;
};

export default HomeHero;
