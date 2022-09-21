import FlexContainer from './FlexContainer';
import styles from './HomeHero.module.scss';

export const HomeHero = ({ children, flexClasses }) => {
  return <FlexContainer className={styles.hero} flexClasses={flexClasses}>{children}</FlexContainer>;
};

export default HomeHero;
