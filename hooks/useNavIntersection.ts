import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import useNavStore from '../store/navStore';
import { NavItems } from '../types';

export const useNavIntersection = (
  threshold: number,
  currentNavSection: NavItems,
) => {
  const { navItem, navElements, setNavItem, addElement } = useNavStore();
  const [lastNav, setLastNav] = useState(navItem);
  const ref = useRef<HTMLDivElement>();
  const { ref: inViewRef, inView } = useInView({
    threshold,
  });

  // Use `useCallback` so we don't recreate the function on each render
  const setRefs = useCallback(
    (node) => {
      // Ref's from useRef needs to have the node assigned to `current`
      ref.current = node;
      // Callback refs, like the one from `useInView`, is a function that takes the node as an argument
      inViewRef(node);
    },
    [inViewRef],
  );

  if (!navElements.find(navElem => navElem.id === currentNavSection)) {
    addElement({
      id: currentNavSection,
      ref,
    });
  }

  useEffect(() => {
    setNavItem(inView ? currentNavSection : lastNav);
  }, [inView]);

  useEffect(() => {
    // save lastNav anytime nav is set to something other than the current section
    if (navItem !== currentNavSection) {
      setLastNav(navItem);
    }
  }, [navItem]);

  return setRefs;
};

export default useNavIntersection;
