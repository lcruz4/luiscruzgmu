import styled from '@emotion/styled';
import useNavStore from '../../store/navStore';

interface MenuItemWrapperProps {
  active: boolean;
}

const NavMenu = styled.nav`
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  width: 100%;
  height: ${({ theme }) => theme.rems[400]};
  background: ${({ theme }) => theme.colors.primaryBackground};
  border-bottom: 3px solid ${({ theme }) => theme.colors.primary};
  text-align: left;
  z-index: 2;

  color: ${({ theme }) => theme.colors.white};
`;

const MenuItemWrapper = styled.div<MenuItemWrapperProps>`
  display: flex;
  align-items: center;
  height: 100%;
  border-right: 1px solid
    ${({ active, theme }) =>
      active ? theme.colors.spicy : theme.colors.primary};
  border-radius: 3px;
  ${({ active }) => active && 'box-shadow: inset -3px -2px 2px'};
  ${({ active, theme }) => active && `color: ${theme.colors.spicy}`}
`;

const MenuItems = styled.div`
  margin: 0 ${({ theme }) => theme.rems[150]};
  text-transform: uppercase;
  cursor: pointer;
`;

export const NavBar = ({ items }: { items: any }) => {
  const { navItem, navElements } = useNavStore();

  return (
    <NavMenu>
      {items.map((item: any) => (
        <MenuItemWrapper
          onClick={() => {
            const navElem = navElements.find((navElem) => navElem.id === item);
            if (!navElem) {
              return;
            }

            window.scrollTo({
              behavior: 'smooth',
              top: navElem.ref.current.offsetTop - 128,
            });
          }}
          key={item}
          active={item === navItem}
          className='cursor-pointer'
        >
          <MenuItems>{item}</MenuItems>
        </MenuItemWrapper>
      ))}
    </NavMenu>
  );
};
