import { Paper } from '@mui/material';
import styled from '@emotion/styled';

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 64px;
  background: black;
  border-bottom: 3px solid #04c2c9;
  text-align: left;
  z-index: 99;
`;

const Wrapper = styled.div`
  background: none;
  height: initial;
  overflow: visible;
  position: initial;
  text-align: left;

  
  max-width: 1200px;
  top: 67px;
  transition: height 0.3s ease-out;
  width: 100%;
`;

export const NavBar = ({items}) => {
  // return <Paper elevation={1}>{children}</Paper>;
  return (
    <NavMenu>
      <div>
        {items.map(item => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </NavMenu>
  );
};

export default NavBar;
