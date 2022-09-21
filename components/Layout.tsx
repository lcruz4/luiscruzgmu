import styles from './Layout.module.scss';

export const Layout = ({ children }) => {
  return <div className={styles.main}>{children}</div>;
};

export default Layout;
