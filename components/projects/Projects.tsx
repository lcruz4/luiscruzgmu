import styled from '@emotion/styled';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import useNavIntersection from '../../hooks/useNavIntersection';
import { NavItems } from '../../types';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

const StylishSwiper = styled(Swiper)(
  ({ theme }) => `
  height: 500px;
  width: 100%;

  .swiper-slide {
    text-align: center;
    font-size: 18px;
    background: ${theme.colors.white};
    color: ${theme.colors.black};

    /* Center slide text vertically */
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .swiper-slide img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,
);

export const Projects = () => {
  const { ref, inView } = useInView({
    threshold: 0.5,
  });
  const navRef = useNavIntersection(0.5, NavItems.Projects);

  useEffect(() => {
    if (inView) {
      document.getElementsByTagName('video')[0].play();
    } else {
      document.getElementsByTagName('video')[0].pause();
    }
  }, [inView]);

  return (
    <div ref={navRef}>
      <StylishSwiper
        className='z-0'
        pagination={{
          dynamicBullets: true,
        }}
        modules={[Pagination]}
      >
        <SwiperSlide>⛔️ Under Construction ⛔️</SwiperSlide>
        <SwiperSlide>Nothing here</SwiperSlide>
        <SwiperSlide>Seriously there's nothing here</SwiperSlide>
        <SwiperSlide>You don't need to check every slide</SwiperSlide>
        <SwiperSlide>...</SwiperSlide>
        <SwiperSlide>...</SwiperSlide>
        <SwiperSlide>There's nothing here</SwiperSlide>
        <SwiperSlide>Come on man!</SwiperSlide>
        <SwiperSlide>
          <video
            ref={ref}
            controls
            className='w-full h-full bg-black'
            tabIndex={-1}
          >
            <source src='/videos/neverGonnaGiveYouUp.mp4' type='video/mp4' />
          </video>
        </SwiperSlide>
      </StylishSwiper>
    </div>
  );
};

export default Projects;
