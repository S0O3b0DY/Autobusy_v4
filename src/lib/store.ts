
import { create } from "zustand"
import type { Vehicle, BusStopData, RoutePolyline, LiveVehiclesList } from "../types"
import { MapLibreMap } from "maplibre-gl"

export const INIT_SHOWN_LINES = ["92A", "92B", "82B", "69A", "69B", "72A", "72B", "75A", "75B"]

type MenuState = 0 | 1 | 2 | 3 | 4 | 5

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
  liveVehiclesList: LiveVehiclesList 
  setLiveVehiclesList: (data: LiveVehiclesList) => void
  shownLines: string[]
  setShownLines: (data: string[]) => void
  query: string
  setQuery: (text: string) => void
  favoriteStops: number[]
  setFavoriteStops: (data: number[]) => void
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
  setVehicles: (vehs: Vehicle[]) => set({ vehicles: vehs }),
  liveVehiclesList: { buses: [], trams: [] },
  setLiveVehiclesList: (data: LiveVehiclesList) => set({ liveVehiclesList: data }),
  shownLines: INIT_SHOWN_LINES,
  setShownLines: (data: string[]) => set({ shownLines: data }),
  query: "",
  setQuery: (text: string) => set({ query: text }),
  favoriteStops: [],
  setFavoriteStops: (data: number[]) => set({ favoriteStops: data }),
}))
