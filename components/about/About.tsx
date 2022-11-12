import styled from "@emotion/styled";
import FlexContainer from "../common/FlexContainer";
import AboutMain from "./AboutMain";

const Underline = styled.div`
  width: 140px;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.white};

  @keyframes glow {
    from { background-color: ${({ theme }) => theme.colors.white}; }
    to { background-color: ${({ theme }) => theme.colors.halfSpicy}; }
  }
  animation: glow 1.5s infinite alternate;
`;

const AboutDescriptionContainer = styled(FlexContainer)(({ theme }) => `
  height: 100px;
  width: 100vw;
  background: ${theme.colors.white};
  color: ${theme.colors.black};
`);

export const About = () => {
  return (
    <FlexContainer flexDirection='column' alignItems='center' fullWidth>
      <h1>ABOUT</h1>
      <Underline />
      <AboutMain />
      <AboutDescriptionContainer fullWidth>
        Blah blah blah
      </AboutDescriptionContainer>
    </FlexContainer>
  )
};

export default About;
