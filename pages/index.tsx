import styled from '@emotion/styled';
import Head from 'next/head'
import { HomeHero, NavBar, About, Projects, FlexContainer } from '../components'

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
      <NavBar items={['home', 'about', 'projects', 'contact']} />
      <StylishLayout justifyContent='center' flexDirection='column'>
        <About />
        <Projects />
      </StylishLayout>
    </>
  );
}
