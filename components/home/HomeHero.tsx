import styled from '@emotion/styled';
import FlexContainer from '../common/FlexContainer';

const StylishContainer = styled(FlexContainer)`
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-image: url('/images/background.jpg');
`;

export const HomeHero = ({ children }) => {
  return <StylishContainer justifyContent='center' alignItems='center'>{children}</StylishContainer>;
};

export default HomeHero;
