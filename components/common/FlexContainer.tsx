import { DetailedHTMLProps, HTMLAttributes, forwardRef } from 'react';
import styled from '@emotion/styled';

interface FlexContainerProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  center?: boolean;
  justifyContent?: string;
  alignItems?: string;
  flexDirection?: string;
  fullWidth?: boolean;
}

const StylishFlexContainer = styled.div<FlexContainerProps>`
  display: flex;
  ${({ justifyContent, alignItems, flexDirection, fullWidth }) => {
    let style = '';

    justifyContent && (style += `justify-content: ${justifyContent};`);
    alignItems && (style += `align-items: ${alignItems};`);
    flexDirection && (style += `flex-direction: ${flexDirection};`);
    fullWidth && (style += `width: 100%;`);
    return style;
  }}
`;

export const FlexContainer = forwardRef<HTMLDivElement, FlexContainerProps>(
  ({ children, ...styleProps }: FlexContainerProps, ref) => {
    return (
      <StylishFlexContainer ref={ref} {...styleProps}>
        {children}
      </StylishFlexContainer>
    );
  },
);
