import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

const RewardChartLanding: React.FC = () => {
  const router = useRouter();

  const handleLogin = () => {
    window.location.href = '/projects/reward-chart';
  };

  return (
    <>
      <Head>
        <title>Luis Cruz | Sight Words Sticker Chart</title>
        <link
          rel='icon'
          href='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌟</text></svg>'
        />
      </Head>
      <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 px-2 sm:px-4 py-4 sm:py-6 md:py-8'>
        <div className='container mx-auto max-w-5xl'>
          {/* Animated Header */}
          <div className='text-center mb-6 sm:mb-8 animate__animated animate__bounceInDown'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg leading-tight'>
              🌟 Sight Words Sticker Chart 🌟
            </h1>
            <div className='text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 animate__animated animate__pulse animate__infinite'>
              ✨ Collect stickers for learning words! ✨
            </div>
          </div>

          {/* Main Chart Container */}
          <div className='bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border-4 sm:border-6 md:border-8 border-yellow-300 animate__animated animate__fadeInUp'>
            {/* Login Prompt */}
            <div className='text-center py-8 sm:py-12'>
              <div className='text-4xl sm:text-6xl mb-4'>🔒</div>
              <h2 className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4'>
                Please Log In to Access Your Sticker Chart
              </h2>
              <p className='text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8'>
                You need to be logged in to view and manage your stickers.
              </p>
              <button
                onClick={handleLogin}
                className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto'
              >
                <span className='text-xl'>🚀</span>
                Log In to Start Collecting Stickers!
              </button>
            </div>
          </div>

          {/* Motivational Footer */}
          <div className='text-center animate__animated animate__fadeInUp animate__delay-1s'>
            <div className='text-lg sm:text-xl md:text-2xl lg:text-3xl text-white font-bold drop-shadow-lg mb-2 leading-tight'>
              🌟 You're doing AMAZING! Keep learning! 🌟
            </div>
            <div className='text-sm sm:text-base md:text-lg text-white/90'>
              Every sticker means you learned something new! 📚✨
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/auth/authorize`,
    {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    },
  );
  const email = response.headers.get('x-authenticated-email') || null;

  // If user is authenticated, redirect to the main reward chart page
  if (email) {
    return {
      redirect: {
        destination: '/projects/reward-chart',
        permanent: false,
      },
    };
  }

  // User is not authenticated, show landing page
  return {
    props: {},
  };
};

export default RewardChartLanding;