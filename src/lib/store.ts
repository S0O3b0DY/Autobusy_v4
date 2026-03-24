import { create } from "zustand"
import type { Vehicle, BusStopData, RoutePolyline } from "../types"
import { MapLibreMap } from "maplibre-gl"


type MenuState = 0 | 1 | 2 | 3 | 4

interface AppStore {
  map: MapLibreMap | null
  setMap: (map: MapLibreMap) => void
  selectedVehicle: Vehicle | null
  setSelectedVehicle: (veh: Vehicle | null) => void
  selectedBusStop: BusStopData | null
  setSelectedBusStop: (bsData: BusStopData | null) => void
  menuState: MenuState
  setMenuState: (state: MenuState) => void
  menuShown: boolean
  setMenuShown: (state: boolean) => void
  routePolyline: RoutePolyline[] | []
  setRoutePolyline: (data: RoutePolyline[]) => void
  routeBusStops: BusStopData[] | []
  setRouteBusStops: (data: BusStopData[]) => void
  vehicles: Vehicle[] | []
  setVehicles: (vehs: Vehicle[]) => void
}

export const useAppStore = create<AppStore>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  selectedVehicle: null,
  setSelectedVehicle: (veh: Vehicle | null) => set({ selectedVehicle: veh }),
  selectedBusStop: null,
  setSelectedBusStop: (bsData: BusStopData | null) => set({ selectedBusStop: bsData }),
  menuState: 0,
  setMenuState: (state: MenuState) => set({ menuState: state }),
  menuShown: false,
  setMenuShown: (state: boolean) => set({ menuShown: state }),
  routePolyline: [],
  setRoutePolyline: (data: RoutePolyline[]) => set({ routePolyline: data }),
  routeBusStops: [],
  setRouteBusStops: (data: BusStopData[]) => set({ routeBusStops: data }),
  vehicles: [],
  setVehicles: (vehs: Vehicle[]) => set({ vehicles: vehs })
}))