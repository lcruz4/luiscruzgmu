import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import styles from './FlexContainer.module.scss';
import styled from '@emotion/styled';

interface FlexContainerProps extends PropsWithChildren {
  className?: string;
  center?: boolean;
}

const StylishFlexConatiner = styled.div<FlexContainerProps>`
  display: flex;
  ${center => {
    if (center) {
      return `
        align-items: center;
        justify-content: center;
      `;
    }
  }}
`;

export const FlexContainer = ({children, center, className}: FlexContainerProps) => {
  return <StylishFlexConatiner className={className} center={center}>
    {children}
  </StylishFlexConatiner>
};

export default FlexContainer;
