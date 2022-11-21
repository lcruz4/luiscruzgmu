import styled from '@emotion/styled';
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper";
import "swiper/css";
import "swiper/css/pagination";

const StylishSwiper = styled(Swiper)(({ theme }) => `
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
`);

export const Projects = () => {
  return (
    <>
      <StylishSwiper className='z-0'
        pagination={{
          dynamicBullets: true,
        }}
        modules={[Pagination]}
      >
        <SwiperSlide>Project 1</SwiperSlide>
        <SwiperSlide>Project 2</SwiperSlide>
        <SwiperSlide>Project 3</SwiperSlide>
        <SwiperSlide>Project 4</SwiperSlide>
        <SwiperSlide>Project 5</SwiperSlide>
        <SwiperSlide>Project 6</SwiperSlide>
        <SwiperSlide>Project 7</SwiperSlide>
        <SwiperSlide>Project 8</SwiperSlide>
        <SwiperSlide>Project 9</SwiperSlide>
      </StylishSwiper>
    </>
  );
};

export default Projects;
