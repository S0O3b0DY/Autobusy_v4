import { parseCsv2 } from './parser';

export function buildStopsJson(raw: Uint8Array) {
  return parseCsv2(raw).map(s => ({
    id: parseInt(s.stop_id),
    n:  s.stop_name,
    y:  parseFloat(s.stop_lat),
    x:  parseFloat(s.stop_lon),
    z:  parseInt(s.zone_id) || 0,
  }));
}