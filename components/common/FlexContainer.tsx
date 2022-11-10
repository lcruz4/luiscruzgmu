import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import styles from './FlexContainer.module.scss';
import styled from '@emotion/styled';

interface FlexContainerProps extends PropsWithChildren {
  className?: string;
  center?: boolean;
  justifyContent?: string;
  alignItems?: string;
}

const StylishFlexConatiner = styled.div<FlexContainerProps>`
  display: flex;
  ${({
    justifyContent,
    alignItems,
  }) => {
    let style = '';

    justifyContent && (style += `justify-content: ${justifyContent};`);
    alignItems && (style += `align-items: ${alignItems};`);
    return style;
  }}
`;

export const FlexContainer = ({children, className, ...styleProps}: FlexContainerProps) => {
  return <StylishFlexConatiner className={className} {...styleProps}>
    {children}
  </StylishFlexConatiner>
};

export default FlexContainer;
