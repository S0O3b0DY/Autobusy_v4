// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// ==========================
// STOPS
// ==========================
export type BusStopDeparture = {
  routeID: number;                 // id (z elementu S)
  departTimeInSec: number;         // s (z elementu S)
  dest: string;                    // dir (z elementu R)
  dirType: "T" | "P" | "N" | string; // veh (z elementu S) - w XML masz też "N"
  vehType: "A" | "T" | string;     // vt (z elementu R)
  busStopID: number;               // z parametru args
  timeDepPredMode: number;         // m (z elementu S)
  feat: string;                    // vuw (z elementu R)
  departTimeFormated: string;      // t (z elementu S)
  busLine: string;                 // nr (z elementu R)
  vehId: number;                   // nb (z elementu S)
  // Dodatkowe pola z Twojego interfejsu, których nie ma w tym XML (opcjonalne)
  kn?: string;
  di?: number;
  iks?: number;
}

export interface BusStopTimetable {
  stopID: number
  stopCode: number;
  serverTime: string;
  name: string;
  dayType: number;
  dayName: string;
  departs: BusStopDeparture[];
}

// ==========================
// ROUTES
// ==========================
export type GeoRoutePoint = {
  no: number   // l
  x: number    // x
  y: number    // y
}

export type RouteBusStopPoint = {
  startStopID: number
  endStopID: number
  geoPoints: GeoRoutePoint[]
}

export interface Route {
  routeVar: number
  busLine: string
  stops: RouteBusStopPoint[]
}

export type RoutePolyline = [number, number]


// ==========================
// VEHICLES
// ==========================
export interface OldVehicle {
  vehId: number                 // id
  sideNum: number               // nb
  lineNum: string               // nr
  routeVar: string              // wt
  dirType: "T" | "P" | ""       // kr
  routeId: number               // ik
  lp: number                    // lp
  distFromStop: number          // dp
  distToStop: number            // dw
  lng: number                   // x
  lat: number                   // y
  prevLng: number               // px
  prevLat: number               // py
  delay: number                 // o
  stat: number                  // s
  departHour: string            // p
  dest: string                  // op
  feat: string                  // c
  nextRouteId: number           // nk
  nextLineNum: string           // nnr
  nextRouteVar: string          // nwt
  nextDirType: "T" | "P" | ""   // nkr
  nextDest: string              // nop
  timeToDep: number             // is
  vehType: "A" | "T"            // vt
  courseId: string              // kwi
}

export interface Vehicle {
  vehId: number                 // id
  lineNum: string               // nr
  dirType: "T" | "P" | ""       // kr
  routeId: number               // ik
  lng: number                   // x
  lat: number                   // y
  bearing: number
  delay: number                 // o
  state: number                  // s
  dest: string                  // op
  // feat: string                  // c?????????????????
  timeToDep: number             // is
  vehType: "A" | "T"            // vt
}


// ==========================
// VEHICLE NEXT STOPS
// ==========================
export type VehicleTimetableDeparure = {
  no: number
  busStopID: number
  busStopName: string
  hrsToDep: number
  minToDep: number
  secToDep: number
  timeToDepInSeconds: number
  timeDepPredMode: number
}

export interface VehicleTimetable {
  routeId: number
  busLine: string
  vehType: string
  dest: string
  dep: VehicleTimetableDeparure[]
}


// ==========================
// LINES LIST
// ==========================
interface LiveVehiclesList {
  buses: string[],
  trams: string[]
}

export interface TimetableRouteList {
  stopId: number
  stopCode: string
  stopName: string
  routes: Record<string, number> 
}

export type Timetable = Record<string, Record<string, string[]>>


export type BusStopData = {
  id: number
  c: string
  n: string
  y: number
  x: number
  z: number
}