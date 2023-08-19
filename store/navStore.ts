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
  addElement: (newElem: NavElement) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  navElements: [],
  navItem: NavItems.Home,
  setNavItem: (newItem: NavItems) => set(() => ({ navItem: newItem })),
  addElement: (newElem: NavElement) =>
    set((state) => {
      state.navElements.push(newElem);

      return state;
    }),
}));

export default useNavStore;
