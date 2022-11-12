import { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import FlexContainer from '../common/FlexContainer';
import FlexItem from '../common/FlexItem';

const PHOTOHEXHEIGHT = 400;

// find longest point between hexagon points given a flat top hexagon of a given height
const calcHexagonPointToPointWidth = height => {
  return height / Math.sin(1.0472)
};

// given the base of a flat top hexagon which is the widest width rectangle with full height
// and a point being the left or right most point, this gives you the width betwen them.
const calcHexagonPointToBaseWidth = height => {
  return (calcHexagonPointToPointWidth(height) - height) / 2;
};

// given the base of a flat top hexagon which is the widest width rectangle with full height
// this gives you it's width
const calcHexagonColumnWidth = height => {
  return height / 2 / Math.cos(0.523598776);
};

const AboutMainContainer = styled(FlexContainer)`
  margin: 50px 0;
`;

const RowContainer = styled(FlexContainer)(({ theme }) => `
  @media screen and (min-width: ${theme.breakpoints.mobileMax}) and (max-width: ${theme.breakpoints.tabletMax}) {
    width: 50%;
  }

  margin: 0 100px;

  &:first-of-type {
    margin-bottom: 100px;
  }

  &:last-of-type {
    margin-top: 100px;
  }
`);

const AboutItemContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: ${calcHexagonPointToPointWidth(200)}px;
`;

interface HexagonMixinProps {
  theme?: Theme;
  height?: number;
  background?: string;
}

// spin animation
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

// the hexagon base
const hexagonColumnMixin = ({ theme, height, background }: HexagonMixinProps) => `
  width: ${calcHexagonColumnWidth(height || 200)}px;
  height: ${height || 200}px;
  background: ${background || theme.other.aboutHexagonGradient};
  box-shadow: inset 0px 2px #04c2c9, inset 0px -2px ${theme.colors.primary};
`;

// the angled rectangles which make the other edges of the hexagon using before and after
const hexagonHelpersMixin = ({ theme, height, background }: HexagonMixinProps) => `
  content: '';
  position: absolute;
  ${hexagonColumnMixin({theme, height, background})}
`;

const Hexagon = styled.div(({ theme }) => `
  ${hexagonColumnMixin({theme})}

  &::before {
    ${hexagonHelpersMixin({theme})}
    transform: rotate(60deg);
  }

  &::after {
    ${hexagonHelpersMixin({theme})}
    transform: rotate(120deg);
  }
`);

const AboutItemText = styled.div(({ theme }) => `
  width: ${calcHexagonPointToPointWidth(200)}px;
  color: ${theme.colors.black};
  text-shadow: 1px 1px ${theme.colors.white};
  text-align: center;
`);

// -200px vertical margin to nestle in with other hexagons
const PhotoFrame = styled.div`
  position: relative;
  height: ${PHOTOHEXHEIGHT}px;
  width: ${calcHexagonPointToPointWidth(PHOTOHEXHEIGHT)}px;
  margin: -200px 0;
  overflow: hidden;
`;

// overflow hidden used to mask photo
const PhotoFrameHelper1 = styled.div`
  position: absolute;
  height: 800px;
  top: -50%;
  left: ${calcHexagonPointToBaseWidth(PHOTOHEXHEIGHT)}px;
  overflow: hidden;
  rotate: 30deg;
`;

// overflow hidden used to mask photo
const PhotoFrameHelper2 = styled.div`
  height: 800px;
  width: ${PHOTOHEXHEIGHT}px;
  overflow: hidden;
  rotate: -60deg;
`;

// rotate and positioning fields in order to correct positioning changed by photo mask containers
const Photo = styled.img`
  position: absolute;
  top: 25%;
  left: -${calcHexagonPointToBaseWidth(PHOTOHEXHEIGHT)}px;
  height: ${PHOTOHEXHEIGHT}px;
  width: ${calcHexagonPointToPointWidth(PHOTOHEXHEIGHT)}px;
  object-fit: cover;
  rotate: 30deg;
`;

const AboutMain = () => (
  <AboutMainContainer flexDirection='column' alignItems='center' fullWidth>
    <RowContainer fullWidth>
      <AboutItemContainer>
        <SpinContainer>
          <Hexagon />
        </SpinContainer>
        <AboutItemText>QUALITY</AboutItemText>
      </AboutItemContainer>
      <FlexItem flex='1 0 0'/>
      <AboutItemContainer>
        <SpinContainer>
          <Hexagon />
        </SpinContainer>
        <AboutItemText>DETAIL ORIENTED</AboutItemText>
      </AboutItemContainer>
    </RowContainer>
    <PhotoFrame>
      <PhotoFrameHelper1>
        <PhotoFrameHelper2>
            <Photo src='/images/profile.jpg'/>
        </PhotoFrameHelper2>
      </PhotoFrameHelper1>
    </PhotoFrame>
    <RowContainer fullWidth>
      <AboutItemContainer>
        <SpinContainer>
          <Hexagon />
        </SpinContainer>
        <AboutItemText>COMMUNICATION</AboutItemText>
      </AboutItemContainer>
      <FlexItem flex='1 0 0'/>
      <AboutItemContainer>
        <SpinContainer>
          <Hexagon />
        </SpinContainer>
        <AboutItemText>OWNERSHIP</AboutItemText>
      </AboutItemContainer>
    </RowContainer>
  </AboutMainContainer>
);

export default AboutMain;