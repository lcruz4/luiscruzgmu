import Head from 'next/head'
import { useMediaQuery } from 'usehooks-ts';
import styled from '@emotion/styled';
import { NavItems } from '../types';
import { HomeHero, NavBar, About, Projects, Contact, FlexContainer } from '../components'

const Title = styled.h1`
  text-align: center;
`;

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.highlight};
`;

const StylishLayout = styled(FlexContainer)`
  margin: ${({ theme }) => theme.rems[400]};

  &> div {
    margin: 64px 0;
  }
`;

const Underline = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.white};

  @keyframes glow {
    from { background-color: ${({ theme }) => theme.colors.spicy}; }
    to { background-color: ${({ theme }) => theme.colors.coolRanch}; }
  }
  animation: glow 1.5s infinite alternate;
`;

export default function Home() {
  const isDesktop = useMediaQuery('(min-width: 850px)');

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
      {isDesktop ? <NavBar items={Object.values(NavItems)} /> : <Underline />}
      <StylishLayout justifyContent='center' flexDirection='column'>
        <About />
        <Projects />
        <Contact />
      </StylishLayout>
    </>
  );
}
