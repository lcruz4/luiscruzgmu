import styled from '@emotion/styled';
import FlexContainer from './FlexContainer';

const StylishLayout = styled(FlexContainer)`
  margin: ${({ theme }) => theme.rems[400]};
  height: 2000px;
`;

export const Layout = ({ children }) => {
  return <StylishLayout justifyContent='center'>{children}</StylishLayout>;
};

export default Layout;
