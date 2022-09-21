import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import styles from './FlexContainer.module.scss';

interface FlexContainerProps extends PropsWithChildren {
  className?: string;
  flexClasses?: string[];
}

export const FlexContainer = ({children, className, flexClasses}: FlexContainerProps) => {
  return <div className={clsx([
    styles.flexContainer,
    className,
    ...(flexClasses.map(cl => styles[cl]))
  ])}>
    {children}
  </div>
};

export default FlexContainer;
