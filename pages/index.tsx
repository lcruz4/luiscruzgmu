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
        <div className="w-full max-w-xs">
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Username
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username" />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" />
              <p className="text-red-500 text-xs italic">Please choose a password.</p>
            </div>
            <div className="flex items-center justify-between">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                Sign In
              </button>
              <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
                Forgot Password?
              </a>
            </div>
          </form>
          <p className="text-center text-gray-500 text-xs">
            &copy;2020 Acme Corp. All rights reserved.
          </p>
        </div>
      </StylishLayout>
    </>
  );
}
