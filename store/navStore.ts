import { MutableRefObject } from 'react';
import { create } from 'zustand';
import { NavItems } from '../types';

interface NavElement {
  id: NavItems;
  ref: MutableRefObject<HTMLDivElement>;
}

interface NavStore {
  navElements: NavElement[];
  navItem: NavItems;
  setNavItem: (newItem: NavItems) => void;
  setElement: (newElem: NavElement) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  navElements: [],
  navItem: NavItems.Home,
  setNavItem: (newItem: NavItems) => set(() => ({ navItem: newItem })),
  // One element per section; a remounted section replaces its old ref
  setElement: (newElem: NavElement) =>
    set((state) => ({
      navElements: [
        ...state.navElements.filter((elem) => elem.id !== newElem.id),
        newElem,
      ],
    })),
}));

export default useNavStore;
