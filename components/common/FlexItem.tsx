import styled from '@emotion/styled';

interface FlexItemProps {
  className?: string;
  flex?: string;
}

const StylishFlexConatiner = styled.div<FlexItemProps>`
  ${({
    flex
  }) => {
    let style = '';

    flex && (style += `flex: ${flex};`);
    return style;
  }}
`;

export const FlexItem = ({className, ...styleProps}: FlexItemProps) => {
  return <StylishFlexConatiner className={className} {...styleProps} />
};

export default FlexItem;
