// ==========================
// STOPS
// ==========================

export type BusStopDeparture = {
  routeID: number                 // i
  departTimeInSec: number         // t
  dest: string                    // d
  dirType: "T" | "P"              // dd
  vehType: "A" | "T"              // p
  busStopID: number               // ip
  timeDepPredMode: number         // m
  feat: string                    // vn
  departTimeFormated: string      // v
  kn: string                      // kn
  di: number                      // di
  iks: number                     // iks
  busLine: string                 // r
}

export interface BusStopTimetable {
  id: number
  serverTime: string
  departs: BusStopDeparture[]
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

export interface Vehicle {
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
  vehType: number
  dest: string
  dep: VehicleTimetableDeparure[]
}




export type BusStopData = {
  id: number
  n: string
  y: number
  x: number
  z: number
}

interface MapProps {
  center?: [number, number]
  zoom?: number
  style?: string
}

interface LiveVehiclesList {
  buses: string[],
  trams: string[]
}

<<<<<<< HEAD



type LangsListObj = {
  name: string
  flagUrl: string
}

export type LangsList = {
  [key: string]: LangsListObj
}

export type StopIconType = 'default' | 'selected' | 'first' | 'last'
































=======
>>>>>>> main
// export type DirectionType = 'P' | 'T';
// export type VehicleType = 'T' | 'A'; // T=tram, A=bus
// export type VehicleStatus = 1 | 2 | 3 | 6 | 7; // 1=moving, 2=at stop, 3=depot, 6=inactive, 7=off-route

// export interface Vehicle {
//   vehicleId: number;           // id
//   sideNumber: number;          // nb
//   lineNumber: string | "";     // nr
//   routeVariant: string | "";   // wt
//   directionType: DirectionType | ''; // kr
//   routeId: number;             // ik
//   lp: number;                  // lp
//   distanceFromStop: number;    // dp
//   distanceToStop: number;      // dw
//   longitude: number;           // x
//   latitude: number;            // y
//   prevLongitude: number;       // px
//   prevLatitude: number;        // py
//   delay: number;               // o
//   delayFormated: string
//   status: VehicleStatus;       // s
//   departureHour: string | "";  // p
//   nextRouteId: number;             // ik
//   arrivalHour: string
//   nextLineNumber: string;      // nnr
//   nextRouteVariant: string;    // nwt
//   nextDirectionType: DirectionType | ''; // nkr
//   timeToDeparture: number;     // is
//   vehicleType: VehicleType;    // vt
//   features: string;            // c
//   direction: string | "";      // op
//   nextDirection: string;       // nop
//   compass: number
//   XX: number
// }

// type BusIconProps = {
//   veh: Vehicle
// }













// // export type Vehicle = {
// //   vehicleId: number,           // id
// //   sideNumber: number,    // nb
// //   lineNumber: string,         // nr | null
// //   routeVariant: string,     // nnr | null
// //   directionType: string,          // op
// //   routeId: string,      // nop
// //   lp: number,          // y
// //   distanceFromStop: number,          // x
// //   distanceToStop: number,        // o
// //   longitude: "A" | "T"    // vt
// //   latitude: number,      // ik
// //   nextRouteId: number   // nk
// //   is: number            // is
// // }


// // export interface Vehicle {
// //   vehicleId: number;           // id
// //   sideNumber: number;          // nb
// //   lineNumber: string | "";     // nr
// //   routeVariant: string | "";   // wt
// //   directionType: DirectionType | ''; // kr
// //   routeId: number;             // ik
// //   lp: number;                  // lp
// //   distanceFromStop: number;    // dp
// //   distanceToStop: number;      // dw
// //   longitude: number;           // x
// //   latitude: number;            // y
// //   prevLongitude: number;       // px
// //   prevLatitude: number;        // py
// //   delay: number;               // o
// //   status: VehicleStatus;       // s
// //   departureHour: string | "";  // p
// //   destination: string | "";    // op
// //   features: string;            // c
// //   nextRouteId: number;         // nk
// //   nextLineNumber: string;      // nnr
// //   nextRouteVariant: string;    // nwt
// //   nextDirectionType: DirectionType | ''; // nkr
// //   nextDestination: string;     // nop
// //   timeToDeparture: number;     // is
// //   vehicleType: VehicleType;    // vt
// //   courseId: string;            // kwi
// // }