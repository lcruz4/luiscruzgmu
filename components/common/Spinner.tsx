import styled from '@emotion/styled';

const BASE = 100;

const StyledSpinner = styled.div`
  display: inline-block;
  position: relative;
  width: ${40 * BASE/100}px;
  margin: 0 ${4 * BASE/100}px;
  div {
    position: absolute;
    top: -${9 * BASE/100}px;
    width: ${7 * BASE/100}px;
    height: ${7 * BASE/100}px;
    border-radius: 50%;
    transition: background-color 2.4s linear;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }
  div:nth-of-type(1) {
    left: ${4 * BASE/100}px;
    animation: lds-ellipsis1 0.6s infinite, color 2.4s infinite;
  }
  div:nth-of-type(2) {
    left: ${4 * BASE/100}px;
    animation: lds-ellipsis2 0.6s infinite, color 2.4s infinite;
  }
  div:nth-of-type(3) {
    left: ${16 * BASE/100}px;
    animation: lds-ellipsis2 0.6s infinite, color 2.4s infinite;
  }
  div:nth-of-type(4) {
    left: ${28 * BASE/100}px;
    animation: lds-ellipsis3 0.6s infinite, color 2.4s infinite;
  }
  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(${12 * BASE/100}px, 0);
    }
  }
  @keyframes color {
    0% {
      background: #04c2c9;
    }
    50% {
      background: #ec4899;
    }
    100% {
      background: #04c2c9;
    }
`;

export const Spinner = () => (
  <StyledSpinner>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </StyledSpinner>
);

export default Spinner;
