import { Paper } from '@mui/material';
import styled from '@emotion/styled';

interface MenuItemWrapperProps {
  active: boolean
}

const NavMenu = styled.nav`
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  width: 100%;
  height: 64px;
  background: #1b242f;
  border-bottom: 3px solid #04c2c9;
  text-align: left;
  z-index: 1;

  color: white;
`;

const MenuItemWrapper = styled.div<MenuItemWrapperProps>`
  display: flex;
  align-items: center;
  height: 100%;
  border-right: 1px solid ${props => props.active ? '#ec3e85' : '#04c2c9'};
  border-radius: 3px;
  ${props => props.active && 'box-shadow: inset -3px -2px 2px'};
  ${props => props.active && 'color: #ec3e85'}
`;

const MenuItems = styled.div`
  margin: 0 20px;
  text-transform: uppercase;
  cursor: pointer;
`;

export const NavBar = ({items}) => {
  return (
    <NavMenu>
      {items.map(item => (
        <MenuItemWrapper active={item === 'home'}>
          <MenuItems key={item} >{item}</MenuItems>
        </MenuItemWrapper>
      ))}
    </NavMenu>
  );
};

export default NavBar;
