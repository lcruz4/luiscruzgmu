import { Theme } from "@emotion/react";
import styled from "@emotion/styled";
import FlexContainer from "../common/FlexContainer";

const calcHexagonPointToPointWidth = height => {
  return height / Math.sin(1.0472)
};

const calcHexagonPointToBaseWidth = height => {
  return (calcHexagonPointToPointWidth(height) - height) / 2;
};

const calcHexagonColumnWidth = height => {
  return height / 2 / Math.cos(0.523598776);
};

const StylishAbout = styled.h1`
`;

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

interface HexagonMixinProps {
  theme?: Theme;
  height?: number;
  background?: string;
}

const hexagonMixin = ({ theme, height, background }: HexagonMixinProps) => `
  width: ${calcHexagonColumnWidth(height || 200)}px;
  height: ${height || 200}px;
  background: ${background || theme.colors.primary};
`;

const hexagonHelpersMixin = ({ theme, height, background }: HexagonMixinProps) => `
  content: '';
  position: absolute;
  ${hexagonMixin({theme, height, background})}
`;

const spinMixin = (from, to) => `
  @keyframes spin {
    from { transform: rotate(${from}deg); }
    to { transform: rotate(${to}deg); }
  }
  animation: spin 5s ease-out 200s infinite normal;
`;

const SpinContainer = styled.div`
  position: absolute;
  z-index: -1;

  ${spinMixin(0, 180)}
`;

const Hexagon = styled.div(({ theme }) => `
  ${hexagonMixin({theme})}

  &::before {
    ${hexagonHelpersMixin({theme})}
    transform: rotate(60deg);
  }

  &::after {
    ${hexagonHelpersMixin({theme})}
    transform: rotate(120deg);
  }
`);

const AboutItem = styled.div(({ theme }) => `
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  margin: 100px;
`);

const AboutItemText = styled.div(({ theme }) => `
  width: 200px;
  color: ${theme.colors.white};
  text-shadow: 1px 1px ${theme.colors.black};
  text-align: center;
`);

const AboutItemsContainer = styled(FlexContainer)`
`;

const Space = styled.div`
  flex: 1 0;
`;

const PhotoFrame = styled.div`
  position: relative;
  height: 400px;
  width: ${calcHexagonPointToPointWidth(400)}px;
  margin: -200px 0;
  overflow: hidden;

  div {
    position: absolute;
    height: 800px;
    top: -50%;
    left: ${calcHexagonPointToBaseWidth(400)}px;
    overflow: hidden;
    rotate: 30deg;
    img {
      height: 800px;
      width: 400px;
      object-fit: cover;
      z-index: 2; ${/* may move */''}
      rotate: -60deg;
    }
  }
`;

export const About = () => {
  return (
    <FlexContainer flexDirection={'column'} alignItems='center' fullWidth>
      <h1>ABOUT</h1>
      <Underline />
      <AboutItemsContainer fullWidth>
        <AboutItem>
          <SpinContainer><Hexagon /></SpinContainer>
          <AboutItemText>QUALITY</AboutItemText>
        </AboutItem>
        <Space></Space>
        <AboutItem>
          <SpinContainer><Hexagon /></SpinContainer>
          <AboutItemText>DETAIL ORIENTED</AboutItemText>
        </AboutItem>
      </AboutItemsContainer>
      <PhotoFrame>
        <div>
          <img src='/images/profile.jpg'/>
        </div>
      </PhotoFrame>
      <AboutItemsContainer fullWidth>
        <AboutItem>
          <SpinContainer><Hexagon /></SpinContainer>
          <AboutItemText>COMMUNICATION</AboutItemText>
        </AboutItem>
        <Space></Space>
        <AboutItem>
          <SpinContainer><Hexagon /></SpinContainer>
          <AboutItemText>OWNERSHIP</AboutItemText>
        </AboutItem>
      </AboutItemsContainer>
    </FlexContainer>
  )
};

export default About;
