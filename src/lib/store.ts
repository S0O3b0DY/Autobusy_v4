import { create } from "zustand"
import type { Vehicle, BusStopData } from "../types"

type MenuState = 0 | 1 | 2 | 3 | 4

interface AppStore {
  selectedVehicle: Vehicle | null
  setSelectedVehicle: (veh: Vehicle | null) => void
  selectedBusStop: BusStopData | null
  setSelectedBusStop: (bsData: BusStopData | null) => void
  menuState: MenuState
  setMenuState: (state: MenuState) => void
  menuShown: boolean
  setMenuShown: (state: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  selectedVehicle: null,
  setSelectedVehicle: (veh: Vehicle | null) => set({ selectedVehicle: veh }),
  selectedBusStop: null,
  setSelectedBusStop: (bsData: BusStopData | null) => set({ selectedBusStop: bsData }),
  menuState: 0,
  setMenuState: (state: MenuState) => set({ menuState: state }),
  menuShown: false,
  setMenuShown: (state: boolean) => set({ menuShown: state }),
}))