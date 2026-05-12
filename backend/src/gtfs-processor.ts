import { buildStopsJson } from './stops';
import { buildTimetable } from './timetable';
import { shrinkCsv } from './parser';

export class GtfsProcessor {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async process(files: Record<string, Uint8Array>, kv: KVNamespace): Promise<void> {
    console.log('[GtfsProcessor] Rozpoczęcie przetwarzania...');
    
    const encoder = new TextEncoder();
    const TTL = 90_000;

    try {
      // 1. Nadpisanie calendar.txt
      files['calendar.txt'] = encoder.encode("service_id,day_type\n11399_11,rob\n11399_13,sob\n11399_14,nie");

      // 2. Przycinanie kolumn
      console.log('[GtfsProcessor] Optymalizacja rozmiaru plików...');
      files['stop_times.txt'] = shrinkCsv(files['stop_times.txt'], ['trip_id', 'departure_time', 'stop_id']);
      files['trips.txt'] = shrinkCsv(files['trips.txt'], ['route_id', 'service_id', 'trip_id', 'trip_headsign']);

      // 3. Budowanie stops
      console.log('[GtfsProcessor] Budowanie stops.json...');
      await kv.put('stops', JSON.stringify(buildStopsJson(files['stops.txt'])), { expirationTtl: TTL });
      console.log('[GtfsProcessor] ✓ KV: stops gotowe');

      // 4. Przycinanie stops.txt dla timetable
      files['stops.txt'] = shrinkCsv(files['stops.txt'], ['stop_id', 'stop_name']);

      // 5. Budowanie timetable (CIĘŻKIE PRZETWARZANIE)
      console.log('[GtfsProcessor] Budowanie timetable (674k rekordów)...');
      const timetable = buildTimetable(files);
      await kv.put('timetable', timetable, { expirationTtl: TTL });
      console.log('[GtfsProcessor] ✓ KV: timetable gotowe');

      // 6. Metadata
      await kv.put('meta:updated_at', new Date().toISOString(), { expirationTtl: TTL });
      console.log('[GtfsProcessor] ✓ GTFS zaktualizowane');
    } catch (error) {
      console.error('[GtfsProcessor] Błąd podczas przetwarzania:', error);
      throw error;
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method === 'POST') {
      try {
        const body = await request.json() as {
          files: Record<string, string>; // base64 encoded
        };

        // Dekodowanie plików z base64
        const files: Record<string, Uint8Array> = {};
        for (const [name, base64Data] of Object.entries(body.files)) {
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          files[name] = bytes;
        }

        // Przetworzenie w DO (bez limitu CPU)
        await this.process(files, this.env.KV);

        return new Response(JSON.stringify({ success: true, message: 'GTFS processed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: String(error) }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response('Method not allowed', { status: 405 });
  }
}

export default GtfsProcessor;
