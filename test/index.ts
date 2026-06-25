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
  id: number;
  serverTime: string;
  departs: BusStopDeparture[];
}