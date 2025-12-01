import styled from '@emotion/styled';

/**
 * This helper wrapper will hide the first element on mobile and the
 * last element on desktop.
 * @returns {React.FC} Wrapper
 */
export const DesktopMobileSwitch = styled.div`
  display: contents;

  &> :first-child {
    @media (max-width: 849px) {
      display: none;
    }
  }
  &> :last-child {
    @media (min-width: 850px) {
      display: none;
    }
  }
`;

export const DesktopOnly = styled.div`
  display: contents;

  @media (max-width: 849px) {
    display: none;
  }
`;

export const MobileOnly = styled.div`
  display: contents;

  @media (min-width: 850px) {
    display: none;
  }
`;
