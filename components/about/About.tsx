import styled from "@emotion/styled";
import FlexContainer from "../common/FlexContainer";

const StylishAbout = styled.h1`
`;

const Underline = styled.div`
  width: 140px;
  height: ${({ theme }) => theme.rems[25]};
  background-color: ${({ theme }) => theme.colors.white};

  @keyframes glow {
    from {
      background-color: ${({ theme }) => theme.colors.white};
    }
    to {
      background-color: ${({ theme }) => theme.colors.halfSpicy};
    }
  }
  animation: glow 1.5s infinite alternate;
`;

export const About = () => {
  return (
    <FlexContainer flexDirection={'column'} alignItems='center'>
      <StylishAbout>ABOUT</StylishAbout>
      <Underline />
    </FlexContainer>
  )
};

export default About;
