import styled from '@emotion/styled';

const StylishLayout = styled.div`
  height: 2000px;
`;

export const Layout = ({ children }) => {
  return <StylishLayout>{children}</StylishLayout>;
};

export default Layout;
