import { create } from "zustand"

type MenuState = 0 | 1 | 2 | 3 | 4

interface MenuStore {
  menuState: MenuState
  setMenuState: (state: MenuState) => void
}

export const useMenuStore = create<MenuStore>((set) => ({
  menuState: 0,
  setMenuState: (state: MenuState) => set({ menuState: state }),
}))