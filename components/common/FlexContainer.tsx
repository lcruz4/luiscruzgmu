import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import styles from './FlexContainer.module.scss';
import styled from '@emotion/styled';

interface FlexContainerProps extends PropsWithChildren {
  className?: string;
  center?: boolean;
  justifyContent?: string;
  alignItems?: string;
  flexDirection?: string;
  fullWidth?: boolean;
}

const StylishFlexConatiner = styled.div<FlexContainerProps>`
  display: flex;
  ${({
    justifyContent,
    alignItems,
    flexDirection,
    fullWidth
  }) => {
    let style = '';

    justifyContent && (style += `justify-content: ${justifyContent};`);
    alignItems && (style += `align-items: ${alignItems};`);
    flexDirection && (style += `flex-direction: ${flexDirection};`);
    fullWidth && (style += `width: 100%;`);
    return style;
  }}
`;

export const FlexContainer = ({children, className, ...styleProps}: FlexContainerProps) => {
  return <StylishFlexConatiner className={className} {...styleProps}>
    {children}
  </StylishFlexConatiner>
};

export default FlexContainer;
