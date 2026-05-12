import * as fflate from 'fflate';
import { buildStopsJson } from './stops';
import { buildTimetable  } from './timetable';
import { shrinkCsv } from './parser';

export interface Env {
  KV:              KVNamespace;
  GTFS_URL:        string;
  ARCHIVE_API_SECRET: string;
  GTFS_PROCESSOR:  DurableObjectNamespace;
}

export default {

  // ── Cron: odświeżanie GTFS raz dziennie ──────────────────────
  async scheduled(_e: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(refreshGtfs(env));
  },

  // ── API ───────────────────────────────────────────────────────
  async fetch(request: Request, env: Env, ctx: ScheduledEvent): Promise<Response> {
    const url  = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    let upstreamUrl: string | null = null;
    let parserFn:    Function | null = null;

    if (path === '/init:e2c35ec406cd3be83ff6591d169491b724c09835a27dd7f1065bf00cdb674e10') {
      ctx.waitUntil(refreshGtfs(env))
      return new Response("Aktualizacja GTFS wystartowała w tle...", { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }
    // ===== STOPS =====

    if (path === '/stops') {
      const data = await env.KV.get('stops');
      if (!data) return apiError(503, 'DATA_NOT_READY', 'GTFS data not yet loaded');
      return new Response(data, { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }

    // /stops/{stopId} → real-time odjazdy z rozklady.lodz.pl
    let m = path.match(/^\/stops\/([^/]+)$/);
    if (m) {
      upstreamUrl = `http://rozklady.lodz.pl/myBusServices/SchedulesService.svc/GetTimetableReal?nBusStopId=${m[1]}`;
      parserFn = parseStopXML;
    }

    // ===== ROUTES =====

    // /routes/{routeId}
    m = path.match(/^\/routes\/([^/]+)$/);
    if (m) {
      upstreamUrl = `http://rozklady.lodz.pl/myBusServices/SchedulesService.svc/GetRouteVariantWithTransitPoints?nIdKursu=${m[1]}`;
      parserFn = parseRouteXML;
    }

    if (path === '/routes') {
      return apiError(400, 'ROUTE_ID_REQUIRED', 'routeId is required');
    }

    // ===== VEHICLES =====

    // /vehicles
    if (path === '/vehicles') {
      upstreamUrl = `http://rozklady.lodz.pl/myBusServices/SchedulesService.svc/GetVehicles`;
      parserFn = parseVehicleXML;
    }

    // /vehicles/{vehicleId}
    m = path.match(/^\/vehicles\/([^/]+)$/);
    if (m) {
      upstreamUrl = `http://rozklady.lodz.pl/myBusServices/SchedulesService.svc/GetVehicles?cRouteLst=${m[1]}`;
      parserFn = parseVehicleXML;
    }

    // /vehicles/{vehicleId}/next-stops
    m = path.match(/^\/vehicles\/([^/]+)\/next-stops$/);
    if (m) {
      const vehicleId = m[1];

      if (vehicleId.includes(',')) {
        return apiError(400, 'MULTIPLE_IDS_NOT_ALLOWED', 'next-stops endpoint accepts only single vehicleId');
      }

      upstreamUrl = `http://rozklady.lodz.pl/myBusServices/SchedulesService.svc/getVehicleTimeTable?nNb=${m[1]}`;
      parserFn = parseVehicleNextStopsXML;
    }

    // ===== VEHICLE LIST =====
    if (path === '/list') {
      upstreamUrl = `http://rozklady.lodz.pl/Home/GetRouteList`;
      parserFn = parseVehicleList;
    }

    // ===== GTFS TIMETABLE =====

    // /timetable/{stopId} → rozkład przystanku z KV (GTFS)
    m = path.match(/^\/timetable\/(\d+)$/);
    if (m) {
      const raw = await env.KV.get('timetable');
      if (!raw) return apiError(503, 'DATA_NOT_READY', 'GTFS data not yet loaded');
      const stop = JSON.parse(raw)[m[1]];
      if (!stop) return apiError(404, 'STOP_NOT_FOUND', 'stop not found');
      return new Response(JSON.stringify(stop), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // /meta → data ostatniej aktualizacji GTFS
    if (path === '/meta') {
      const updated = await env.KV.get('meta:updated_at');
      return new Response(JSON.stringify({ updated_at: updated }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // ===== NOT FOUND =====
    if (!upstreamUrl) {
      return apiError(404, 'ENDPOINT_NOT_FOUND', 'endpoint not found');
    }

    // ===== FETCH UPSTREAM =====
    const targetDate = new Date(2019, 9, 28);
    const age = String(Math.floor((Date.now() - targetDate.getTime()) / (1000 * 60 * 60 * 24)));
    console.log(age);

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        headers: {
          'User-Agent':       'myBusOnline',
          'Accept-Encoding':  'gzip',
          'Age':              age,
        },
      });
    } catch {
      return apiError(502, 'UPSTREAM_DOWN', 'upstream unreachable');
    }

    if (!upstream.ok) {
      return apiError(502, 'UPSTREAM_ERROR', 'upstream returned error');
    }

    const xmlText = await upstream.text();

    // ===== PARSE XML =====
    let data;
    try {
      data = parserFn ? await parserFn(xmlText) : { raw: xmlText };
    } catch {
      return apiError(500, 'XML_PARSE_ERROR', 'failed to parse upstream xml');
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  },
};

//
// ===== XML PARSERS =====
//

async function parseStopXML(xmlText: string) {
  const timetable: any = { id: 0, serverTime: '', departs: [] };

  await new HTMLRewriter()
    .on('Departures', {
      element(el) {
        timetable.id = Number(el.getAttribute('i'));
        timetable.serverTime = el.getAttribute('time') || '';
      },
    })
    .on('D', {
      element(el) {
        timetable.departs.push({
          routeID:           Number(el.getAttribute('i')),
          departTimeInSec:   Number(el.getAttribute('t')),
          dest:              el.getAttribute('d')  || '',
          dirType:           el.getAttribute('dd') || 'T',
          vehType:           el.getAttribute('p')  || 'A',
          busStopID:         Number(el.getAttribute('ip')),
          timeDepPredMode:   Number(el.getAttribute('m')),
          feat:              el.getAttribute('vn') || '',
          departTimeFormated:el.getAttribute('v')  || '',
          kn:                el.getAttribute('kn') || '',
          di:                Number(el.getAttribute('di')),
          iks:               Number(el.getAttribute('iks')),
          busLine:           el.getAttribute('r')  || '',
        });
      },
    })
    .transform(new Response(xmlText, { headers: { 'content-type': 'text/xml' } }))
    .arrayBuffer();

  return timetable;
}

async function parseRouteXML(xmlText: string) {
  const route: any = { routeVar: 0, busLine: '', stops: [] };
  let currentSegment: any = null;

  await new HTMLRewriter()
    .on('R', {
      element(el) {
        route.busLine  = el.getAttribute('r')?.trim() || '';
        route.routeVar = Number(el.getAttribute('t')) || 0;
      },
    })
    .on('T', {
      element(el) {
        currentSegment = {
          startStopID: Number(el.getAttribute('i1')),
          endStopID:   Number(el.getAttribute('i2')),
          geoPoints:   [],
        };
        route.stops.push(currentSegment);
      },
    })
    .on('Pkt', {
      element(el) {
        if (!currentSegment) return;
        currentSegment.geoPoints.push({
          no: Number(el.getAttribute('l')),
          x:  Number(el.getAttribute('x')),
          y:  Number(el.getAttribute('y')),
        });
      },
    })
    .transform(new Response(xmlText, { headers: { 'content-type': 'text/xml' } }))
    .arrayBuffer();

  return route;
}

async function parseVehicleXML(xmlText: string) {
  const vehicles: any[] = [];

  await new HTMLRewriter()
    .on('V', {
      element(el) {
        vehicles.push({
          vehId:       Number(el.getAttribute('id')),
          sideNum:     Number(el.getAttribute('nb')),
          lineNum:     el.getAttribute('nr')?.trim()  || '',
          routeVar:    el.getAttribute('wt')?.trim()  || '',
          dirType:     el.getAttribute('kr')          || '',
          routeId:     Number(el.getAttribute('ik')),
          lp:          Number(el.getAttribute('lp')),
          distFromStop:Number(el.getAttribute('dp')),
          distToStop:  Number(el.getAttribute('dw')),
          lng:         Number(el.getAttribute('x')),
          lat:         Number(el.getAttribute('y')),
          prevLng:     Number(el.getAttribute('px')),
          prevLat:     Number(el.getAttribute('py')),
          delay:       Number(el.getAttribute('o')),
          stat:        Number(el.getAttribute('s')),
          departHour:  el.getAttribute('p')           || '',
          dest:        el.getAttribute('op')          || '',
          feat:        el.getAttribute('c')           || '',
          nextRouteId: Number(el.getAttribute('nk')),
          nextLineNum: el.getAttribute('nnr')?.trim() || '',
          nextRouteVar:el.getAttribute('nwt')?.trim() || '',
          nextDirType: el.getAttribute('nkr')         || '',
          nextDest:    el.getAttribute('nop')         || '',
          timeToDep:   Number(el.getAttribute('is')),
          vehType:     el.getAttribute('vt')          || 'A',
          courseId:    el.getAttribute('kwi')?.trim() || '',
        });
      },
    })
    .transform(new Response(xmlText, { headers: { 'content-type': 'text/xml' } }))
    .arrayBuffer();

  return vehicles;
}

async function parseVehicleNextStopsXML(xmlText: string) {
  const timetable: any = { routeId: 0, busLine: '', vehType: 0, dest: '', dep: [] };

  await new HTMLRewriter()
    .on('Schedules', {
      element(el) {
        timetable.routeId = Number(el.getAttribute('id'));
        timetable.busLine = el.getAttribute('nr')?.trim() || '';
        timetable.vehType = Number(el.getAttribute('type'));
        timetable.dest    = el.getAttribute('o') || '';
      },
    })
    .on('Stop', {
      element(el) {
        const s = Number(el.getAttribute('s'));
        timetable.dep.push({
          no:                 Number(el.getAttribute('lp')),
          busStopID:          Number(el.getAttribute('id')),
          busStopName:        el.getAttribute('name') || '',
          hrsToDep:           Math.floor(s / 3600),
          minToDep:           Math.floor((s % 3600) / 60),
          secToDep:           s % 60,
          timeToDepInSeconds: s,
          timeDepPredMode:    Number(el.getAttribute('m')),
        });
      },
    })
    .transform(new Response(xmlText, { headers: { 'content-type': 'text/xml' } }))
    .arrayBuffer();

  return timetable;
}

async function parseVehicleList(dataString: string) {
  const data = JSON.parse(dataString);
  const result: { buses: string[]; trams: string[] } = { buses: [], trams: [] };

  for (const [type, items] of data as [number, string[]][]) {
    const lines: string[] = [];
    for (let i = 1; i < items.length; i += 2) {
      lines.push(items[i].replace(/\.$/, ''));
    }
    if (type === 0) result.buses = lines;
    if (type === 2) result.trams = lines;
  }

  return result;
}

//
// ===== GTFS PROCESSING =====
//

async function parseMultipartResponse(response: Response): Promise<Record<string, Uint8Array>> {
  const contentType = response.headers.get('content-type') || '';
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);
  if (!boundaryMatch) throw new Error('Brak boundary w content-type');
  const boundary = '--' + boundaryMatch[1];

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();

  const files: Record<string, Uint8Array> = {};
  const boundaryBytes = new TextEncoder().encode(boundary);

  // Znajdź wszystkie pozycje boundary
  const positions: number[] = [];
  for (let i = 0; i <= bytes.length - boundaryBytes.length; i++) {
    let match = true;
    for (let j = 0; j < boundaryBytes.length; j++) {
      if (bytes[i + j] !== boundaryBytes[j]) { match = false; break; }
    }
    if (match) positions.push(i);
  }

  for (let p = 0; p < positions.length - 1; p++) {
    const start = positions[p] + boundaryBytes.length;
    const end = positions[p + 1];
    const part = bytes.slice(start, end);

    // Znajdź koniec nagłówków (podwójny CRLF)
    let headerEnd = -1;
    for (let i = 0; i < part.length - 3; i++) {
      if (part[i] === 13 && part[i+1] === 10 && part[i+2] === 13 && part[i+3] === 10) {
        headerEnd = i + 4;
        break;
      }
    }
    if (headerEnd === -1) continue;

    const headers = decoder.decode(part.slice(0, headerEnd));
    
    // Wyciągnij filename z Content-Disposition
    const filenameMatch = headers.match(/filename="?([^";\r\n]+)"?/i);
    if (!filenameMatch) continue;
    const filename = filenameMatch[1].trim();

    // Dane pliku (bez końcowego CRLF)
    let fileData = part.slice(headerEnd);
    if (fileData[fileData.length - 2] === 13 && fileData[fileData.length - 1] === 10) {
      fileData = fileData.slice(0, -2);
    }

    files[filename] = fileData;
  }

  return files;
}

async function refreshGtfs(env: Env) {
  console.log('Pobieranie GTFS...', env.GTFS_URL);
  const response = await fetch(env.GTFS_URL);
  const zipBlob = await response.blob();

  console.log('Wysyłanie do zewnętrznego API do rozpakowania...');

  const formData = new FormData();
  formData.append('File', zipBlob, 'gtfs.zip');

  const apiResponse = await fetch(
    `https://api.archiveapi.com/extract?secret=${env.ARCHIVE_API_SECRET}`,
    { method: 'POST', body: formData }
  );

  if (!apiResponse.ok) {
    throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
  }

  const files = await parseMultipartResponse(apiResponse);
  console.log('Otrzymano rozpakowane pliki:', Object.keys(files));

  // ===== WYSŁANIE DO DURABLE OBJECT =====
  // Kodujemy pliki do base64 (DA się przesłać przez JSON)
  const encodedFiles: Record<string, string> = {};
  for (const [name, data] of Object.entries(files)) {
    const binaryString = String.fromCharCode.apply(null, Array.from(data) as any);
    encodedFiles[name] = btoa(binaryString);
  }

  // Wysyłamy do Durable Object (ma większy limit CPU)
  const id = env.GTFS_PROCESSOR.idFromName('singleton');
  const stub = env.GTFS_PROCESSOR.get(id);

  const processorResponse = await stub.fetch(new Request('http://internal/process', {
    method: 'POST',
    body: JSON.stringify({ files: encodedFiles }),
  }));

  if (!processorResponse.ok) {
    throw new Error(`Processor Error: ${processorResponse.status}`);
  }

  const result = await processorResponse.json();
  console.log('✓ GTFS zaktualizowane przez Durable Object:', result);
}

//
// ===== ERROR + CORS UTILS =====
//

function apiError(status: number, code: string, message: string) {
  return new Response(
    JSON.stringify({ error: { code, message, status } }),
    { status, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
  );
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}