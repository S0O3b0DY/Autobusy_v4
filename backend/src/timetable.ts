import { parseCsv2 } from './parser';

// export function buildTimetable(files: Record<string, Uint8Array>): string {
//   const stops     = parseCsv(files['stops.txt']);
//   const stopTimes = parseCsv(files['stop_times.txt']);
//   const trips     = parseCsv(files['trips.txt']);

//   // ── Podmiana calendar.txt na prosty day_type ──────────────
//   // Bez względu na format pliku w zipie, budujemy własną mapę:
//   // saturday=1 → sob | sunday=1 → nie | reszta → rob
//   const calRaw = parseCsv(files['calendar.txt']);
//   const calMap = new Map<string, string>();

//   for (const row of calRaw) {
//     let dayType: string;

//     if (row.day_type) {
//       // plik już ma day_type (format łódzki) – użyj wprost
//       dayType = row.day_type.trim();
//     } else if (row.saturday === '1') {
//       dayType = 'sob';
//     } else if (row.sunday === '1') {
//       dayType = 'nie';
//     } else {
//       dayType = 'rob';
//     }

//     calMap.set(row.service_id.trim(), dayType);
//   }
//   // ─────────────────────────────────────────────────────────

//   const tripsMap = new Map(trips.map(t => [t.trip_id, t]));
//   const stopsMap = new Map(stops.map(s => [s.stop_id, s]));

//   const dayKey = (t: string) => t === 'rob' ? 'wkd' : t === 'sob' ? 'sat' : 'sun';
//   const data: Record<string, any> = {};

//   for (const st of stopTimes) {
//     const trip    = tripsMap.get(st.trip_id);
//     const dayType = trip ? calMap.get(trip.service_id) : null;
//     const stop    = stopsMap.get(st.stop_id);
//     if (!trip || !dayType || !stop) continue;

//     const id  = st.stop_id;
//     const day = dayKey(dayType);

//     if (!data[id]) data[id] = { name: stop.stop_name, days: { wkd: {}, sat: {}, sun: {} } };

//     const d = data[id].days[day];
//     if (!d[trip.route_id])                     d[trip.route_id] = {};
//     if (!d[trip.route_id][trip.trip_headsign]) d[trip.route_id][trip.trip_headsign] = [];

//     const arr = d[trip.route_id][trip.trip_headsign];
//     arr.push(st.departure_time.slice(0, 5));
//     arr.sort();
//   }

//   return JSON.stringify(data);
// }

interface RawData {
  [key: string]: string;
}

interface TimetableOutput {
  [stopId: string]: {
    name: string;
    days: {
      wkd: Record<string, Record<string, string[]>>;
      sat: Record<string, Record<string, string[]>>;
      sun: Record<string, Record<string, string[]>>;
    };
  };
}

export function buildTimetable(files: Record<string, Uint8Array>): string {
  console.log("buildTimetable");

  // 1. Parsowanie
  const stops = parseCsv2(files['stops.txt']);
  const calendar = parseCsv2(files['calendar.txt']);
  const stopTimes = parseCsv2(files['stop_times.txt']);
  const trips = parseCsv2(files['trips.txt']);

  // 2. Budowanie map (Klasyczne pętle dla najwyższej wydajności)
  const stopsMap = new Map<string, string>();
  for (let i = 0; i < stops.length; i++) {
    stopsMap.set(stops[i].stop_id, stops[i].stop_name);
  }

  // Pre-kalkulacja typu dnia, żeby nie robić IF-ów dla każdego z 670k stop_times
  const calendarMap = new Map<string, 'wkd' | 'sat' | 'sun'>();
  for (let i = 0; i < calendar.length; i++) {
    const c = calendar[i];
    let dayKey: 'wkd' | 'sat' | 'sun' = 'sun';
    if (c.day_type === 'rob') dayKey = 'wkd';
    else if (c.day_type === 'sob') dayKey = 'sat';
    calendarMap.set(c.service_id, dayKey);
  }

  const tripsMap = new Map();
  for (let i = 0; i < trips.length; i++) {
    const t = trips[i];
    const dayKey = calendarMap.get(t.service_id);
    if (dayKey) {
      tripsMap.set(t.trip_id, { 
        route_id: t.route_id, 
        trip_headsign: t.trip_headsign,
        dayKey: dayKey
      });
    }
  }

  // 3. Agregacja (Jedno przejście przez 674k rekordów - ZERO .map() i .filter())
  const data: Record<string, any> = {};

  for (let i = 0; i < stopTimes.length; i++) {
    const st = stopTimes[i];
    const trip = tripsMap.get(st.trip_id);
    
    // Jeśli nie ma tripa, pomijamy
    if (!trip) continue;
    
    const stopName = stopsMap.get(st.stop_id);
    if (!stopName) continue;

    if (!data[st.stop_id]) {
      data[st.stop_id] = {
        name: stopName,
        days: { wkd: {}, sat: {}, sun: {} }
      };
    }

    const dayGroup = data[st.stop_id].days[trip.dayKey];
    
    if (!dayGroup[trip.route_id]) {
      dayGroup[trip.route_id] = {};
    }
    
    if (!dayGroup[trip.route_id][trip.trip_headsign]) {
      dayGroup[trip.route_id][trip.trip_headsign] = [];
    }

    // Dodanie skróconego czasu (slice jest szybki, nie ma potrzeby unikać)
    dayGroup[trip.route_id][trip.trip_headsign].push(st.departure_time.slice(0, 5));
  }

  // 4. Sortowanie godzin (używamy domyślnego sortowania stringów zamiast localeCompare)
  const stopKeys = Object.keys(data);
  for (let i = 0; i < stopKeys.length; i++) {
    const stop = data[stopKeys[i]];
    const days = ['wkd', 'sat', 'sun'] as const;
    
    for (let j = 0; j < days.length; j++) {
      const routes = stop.days[days[j]];
      const routeKeys = Object.keys(routes);
      
      for (let k = 0; k < routeKeys.length; k++) {
        const headsigns = routes[routeKeys[k]];
        const headsignKeys = Object.keys(headsigns);
        
        for (let l = 0; l < headsignKeys.length; l++) {
          // Standardowe, szybkie alfanumeryczne sortowanie ("05:17" < "05:19")
          headsigns[headsignKeys[l]].sort();
        }
      }
    }
  }

  // 5. Serializacja (Zrezygnowano z regexa i ładnego formatowania)
  return JSON.stringify(data);
}