import Head from 'next/head'
import styled from '@emotion/styled';
import { NavItems } from '../types';
import { HomeHero } from '../components/home/HomeHero';
import { NavBar } from '../components/common/NavBar';
import { About } from '../components/about/About';
import { Projects } from '../components/projects/Projects';
import { Contact } from '../components/contact/Contact';
import { FlexContainer } from '../components/common/FlexContainer';
import { DesktopMobileSwitch } from '../components/common/ResponsiveWrappers';

const Underline = styled.div`
  @apply h-1;
  background-color: ${({ theme }) => theme.colors.spicy};
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
        <h1 className='m-8 text-center'>
          Hello 👋, I'm <span className='text-red-300'>Luis Cruz</span>!<br/>A full stack software engineer.
        </h1>
      </HomeHero>
      <DesktopMobileSwitch>
        <NavBar items={Object.values(NavItems)} />
        <div>
          <Underline />
          <Underline />
        </div>
      </DesktopMobileSwitch>
      <FlexContainer className='mx-8 tall:mx-16 venti:mx-24 my-0 child:my-16 child:mx-0' justifyContent='center' flexDirection='column'>
        <About />
        <Projects />
        <Contact />
      </FlexContainer>
    </>
  );
}
