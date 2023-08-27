import Head from 'next/head'
import styled from '@emotion/styled';
import { NavItems } from '../types';
import { HomeHero, NavBar, About, Projects, Contact, FlexContainer, DesktopMobileSwitch } from '../components'

const Title = styled.h1`
  text-align: center;
  margin: 2rem;
`;

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.highlight};
`;

const StylishLayout = styled(FlexContainer)`
  margin: 0 2rem;
  @media (min-width: 450px) {
    margin: 0 4rem;
  }
  @media (min-width: 1024px) {
    margin: 0 6rem;
  }

  &> div {
    margin: 64px 0;
  }
`;

const Underline = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.spicy};

  @keyframes glow {
    from { background-color: ${({ theme }) => theme.colors.spicy}; }
    to { background-color: ${({ theme }) => theme.colors.coolRanch}; }
  }
  @keyframes reverseGlow {
    from { background-color: ${({ theme }) => theme.colors.coolRanch}; }
    to { background-color: ${({ theme }) => theme.colors.spicy}; }
  }
  animation: glow 1.5s infinite alternate;
  &:last-child {
    background-color: ${({ theme }) => theme.colors.coolRanch};
    animation: reverseGlow 1.5s infinite alternate;
  }
`;

export default function Home() {
  return (
    <>
      <Head>
        <title>Luis Cruz | Software Engineer</title>
        <link rel='icon' href='/images/favicon.ico' type='image/gif'/>
        <link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Raleway' />
      </Head>
      <HomeHero>
        <Title>
          Hello 👋, I'm <Highlight>Luis Cruz</Highlight>!<br/>A full stack software engineer.
        </Title>
      </HomeHero>
      <DesktopMobileSwitch>
        <NavBar items={Object.values(NavItems)} />
        <div>
          <Underline />
          <Underline />
        </div>
      </DesktopMobileSwitch>
      <StylishLayout justifyContent='center' flexDirection='column'>
        <About />
        <Projects />
        <Contact />
      </StylishLayout>
    </>
  );
}
