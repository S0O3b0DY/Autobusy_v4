
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { VehicleTimetable, BusStopTimetable, BusStopData, Vehicle, TimetableRouteList, Timetable } from './types/index'
import { transit_realtime } from 'gtfs-realtime-bindings'

export interface Env {
  KV: KVNamespace
  SUPABASE_URL: string
  SUPABASE_KEY: string
}

let VEHICLES_CACHE: { meta: number, vehicleData: Vehicle[] } = { meta: 0, vehicleData: [] }
let RATE_LIMIT_CACHE: Record<string, { minuteTimestamp: number; count: number }> = {}


async function verifyUserToken(idToken: string): Promise<{ uid: string; email: string } | null> {
  try {
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyA1-fVcSTC5y7RFr_9nF6DsAuFzIG7FL20', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken
      })
    })

    if (!response.ok) {
      const errorData = await response.json() as any
      console.error('Błąd Firebase REST API:', errorData)
      return null
    }

    const data = await response.json() as any
    
    if (data.users && data.users.length > 0) {
      const user = data.users[0];
      return {
        uid: user.localId,
        email: user.email
      }
    }

    return null
  } catch (error) {
    console.error('Błąd sieciowy podczas weryfikacji:', error)
    return null
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url  = new URL(request.url)
    const rawPath = url.pathname

    // ===== TOKEN VERIFICATION =====
    if (!rawPath.includes(':')) return apiError(400, 'AUTH TOKEN REQUIRED', 'Foramt: [auth_token]:[enpoint]') 
    let [auth, path] = rawPath.split(':')
    auth = auth.slice(1)
    path = '/'+path

    const tokenVerifyResult = await verifyUserToken(auth)
    console.log(auth)

    if (tokenVerifyResult) {
      const uid = tokenVerifyResult.uid
      const currentMinute = Math.floor(Date.now() / 60000)

      if (!RATE_LIMIT_CACHE[uid]) {
        RATE_LIMIT_CACHE[uid] = { minuteTimestamp: currentMinute, count: 1 }
      } else {
        const userLimit = RATE_LIMIT_CACHE[uid]

        if (userLimit.minuteTimestamp === currentMinute) {
          if (userLimit.count >= 150) {
            return apiError(429, 'TOO MANY REQUESTS', 'Rate limit exceeded.')
          }

          userLimit.count++
        } else {
          RATE_LIMIT_CACHE[uid] = { minuteTimestamp: currentMinute, count: 1 }
        }
      }
    } else if (auth === "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=") {
      console.log("Used auth code")
    } else {
      return apiError(401, 'UNAUTHORIZED ACCESS', 'Given token is invalid')
    }

    
    // ===== END TOKEN VERIFICATION =====

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)



    // ===== CORS PREFLIGHT =====
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    // ===== DISCOVERY =====
    if(path === '/discovery') {
      return new Response(JSON.stringify({
        paths: ['/discovery', '/stops', '/stop[stopId]', '/route/[routeId]', '/vehicles', '/old_vehicles', '/list', '/vehicles/[vehicleId]/next-stop', '/timetable_route_list/[stopId]', '/timetable/[stopId];[routeId]'] 
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }



    // ===== TIMETABLE =====
    // /timetable_route_list/[stopId]
    let mTimetableRouteList = path.match(/^\/timetable_route_list\/([^/]+)$/)
    if (mTimetableRouteList) {
      const rawData = await fetch(`http://rozklady.lodz.pl/Home/GetBusStopRouteList?id=${mTimetableRouteList[1]}`)
      const jsonData: any = await rawData.json()
      console.log(jsonData)

      const routesArray: any[] = jsonData[4][1]
      let subOutput = {}
      for (let i=0; i <= routesArray.length-1; i+=2) {
        // @ts-ignore
        subOutput[routesArray[i+1]] = routesArray[i]
      }

      let output: TimetableRouteList = {
        stopId: jsonData[1],
        stopCode: jsonData[3],
        stopName: jsonData[2],
        routes: subOutput
      }

      return new Response(JSON.stringify(output), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })

    }

    if (path === '/timetable_route_list') {
      return apiError(400, 'STOP_ID_REQUIRED', 'stopId is required')
    }


    let mTimetable = path.match(/^\/timetable\/([^/]+)$/)
    if (mTimetable) {
      if (!mTimetable[1].includes(';')) return apiError(404, 'INVALID_SYNTAX', 'both arguments are required')
        
      const schedule: Timetable = {}

      try {
        const args = mTimetable[1].split(';')
        const rawData = await fetch(`http://rozklady.lodz.pl/Home/GetBusStopTimeTable?busStopId=${args[0]}&routeId=${args[1]}`)
        const jsonData = await rawData.json() as any
  
        const directionsMap: Record<string | number, string> = {}
  
        if (Array.isArray(jsonData[2])) {
          for (const dir of jsonData[2]) {
            directionsMap[dir[1]] = dir[3]
          }
        }
  
  
        if (Array.isArray(jsonData[3])) {
          for (const dayGroup of jsonData[3]) {
            const dayName = dayGroup[1] as string
            
            if (!schedule[dayName]) {
              schedule[dayName] = {}
            }
  
            if (Array.isArray(dayGroup[4])) {
              for (const dep of dayGroup[4]) {
                const dirId = dep[0]
                const dirName = directionsMap[dirId].replace(/\s+/g, ' ') || 'Nieznany'
                const mins = parseInt(dep[2], 10)
                
                const h = Math.floor(mins / 60)
                const m = String(mins % 60).padStart(2, '0')
                const timeFormatted = `${h}:${m}`
  
                if (!schedule[dayName][dirName]) {
                  schedule[dayName][dirName] = []
                }
  
                schedule[dayName][dirName].push(timeFormatted)
              }
            }
          }
        }
      } catch (err) {
        return apiError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error has occured.')
      }
      
      return new Response(JSON.stringify(schedule), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }



    // ===== STOPS =====
    // /stops
    if (path === '/stops') {
      const kvStops = await env.KV.get('stops')
      let { meta, stopsData }: { meta: number, stopsData: BusStopData[] } = JSON.parse(kvStops || '{}')

      if (!kvStops || (Math.floor(Date.now() / 1000) - meta) > 86400) {
        try {
          const limit = 1000
          let allResults: any[] = []
          let from = 0
          let to = 999
          let hasMore = true
  
          while (hasMore) {
            const { data, error }: {data: any, error: any} = await supabase
              .from('gtfs_stops')
              .select('stop_id, stop_code, stop_name, stop_lat, stop_lon, zone_id')
              .range(from, to)
  
            if (error) throw error
  
            if (data.length > 0) {
              allResults = [...allResults, ...data]
              from += limit
              to += limit
            }
  
            if (data.length < limit) {
              hasMore = false
            }
          }
  
          stopsData = allResults.map(item => ({
            id: item.stop_id,
            c: item.stop_code,
            n: item.stop_name,
            y: item.stop_lat,
            x: item.stop_lon,
            z: item.zone_id
          }))

          await env.KV.put('stops', JSON.stringify({ meta: Math.floor(Date.now()/1000), stopsData }))
        } catch (err: any) {
          return apiError(500, 'DATABASE_ERROR', err.message || 'Database error')
        }
      }

      return new Response(JSON.stringify(stopsData), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    // /stop/{stopId}
    let mStop = path.match(/^\/stop\/([^/]+)$/)
    if (mStop) {
      try {
        const { data, error } = await supabase.from('gtfs_stops').select('stop_code').eq('stop_id', mStop[1])
        if (error) throw error
        if (!data || data.length === 0) return apiError(404, 'STOP_NOT_FOUND', 'Stop not found in database')

        const rawData = await fetch(`http://rozklady.lodz.pl/Home/GetTimetableReal?busStopNum=${data[0].stop_code}`)
        const xmlData = await rawData.text()

        const parsedData = await parseStopXML(xmlData, [mStop[1], data[0].stop_code])

        return new Response(JSON.stringify(parsedData), {
          status: 200,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        })
      } catch (err: any) {
        return apiError(500, 'DATABASE_ERROR', err.message || 'Database error')
      }
    }



    // ===== ROUTES =====
    // /route
    if (path === '/route') {
      return apiError(400, 'ROUTE_ID_REQUIRED', 'routeId is required')
    }

    // /route/{routeId}
    let mRoute = path.match(/^\/route\/([^/]+)$/)
    if (mRoute) {
      // polyline:
      const routeId: string = mRoute[1].trim()

      const date = new Date();
      const formattedDate = date.getFullYear() + 
        String(date.getMonth() + 1).padStart(2, '0') + 
        String(date.getDate()).padStart(2, '0')

      var { data, error } = await supabase.rpc('get_route_shape_v2', {
        p_live_trip_id: routeId, p_date: formattedDate
      })

      if (error) {
        return apiError(500, 'DATABASE_ERROR', JSON.stringify(error) || 'Database error')
      }
      
      const formattedDataPolyline = data.map((item: any) => ({
        y: item.shape_pt_lat,
        x: item.shape_pt_lon,
        no: item.shape_pt_sequence
      }))
      
      const shapeId = data[0].shape_id



      // stops:
      var { data, error } = await supabase.rpc('get_trip_stops', {
        p_live_trip_id: routeId, p_date: formattedDate
      })

      const formattedDataStops = data.map((item: any) => ({
        id: item.stop_id,
        c: item.stop_code,
        n: item.stop_name,
        y: item.stop_lat,
        x: item.stop_lon,
        z: item.zone_id,
        no: item.stop_sequence
      }))

      return new Response(JSON.stringify({ routeId, formattedDate, shapeId, points: formattedDataPolyline, stops: formattedDataStops }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }



    // ===== VEHICLES =====
    // /vehicles
    if (path === '/vehicles') {
      if (VEHICLES_CACHE.vehicleData.length === 0 || (Math.floor(Date.now() / 1000) - VEHICLES_CACHE.meta) > 15) {
        const response = await fetch('https://cdn.zbiorkom.live/gtfs-rt/lodz.pb')
        const buffer = await response.arrayBuffer()
        const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buffer))

        const vehiclesMap: any = {}
  
        for (const entity of feed.entity) {
          const vehIdStr = entity.vehicle?.vehicle?.label || entity.tripUpdate?.vehicle?.label
          if (!vehIdStr) continue
  
          if (!vehiclesMap[vehIdStr]) {
            vehiclesMap[vehIdStr] = { position: null, tripUpdate: null }
          }
  
          if (entity.vehicle) {
            vehiclesMap[vehIdStr].position = entity.vehicle
          } else if (entity.tripUpdate) {
            vehiclesMap[vehIdStr].tripUpdate = entity.tripUpdate
          }
        }
  
        const batchRequests = []
        for (const id in vehiclesMap) {
          const v = vehiclesMap[id]
          const tripId = v.position?.trip?.tripId || v.tripUpdate?.trip?.tripId
          const stopSeq = v.position?.currentStopSequence ?? v.tripUpdate?.stopTimeUpdate?.[0]?.stopSequence
        
  
          if (tripId && stopSeq !== undefined) {
            batchRequests.push({ trip_id: tripId, stop_sequence: stopSeq + 1 })
          }
        }
        
        if (batchRequests.length === 0) return new Response(JSON.stringify([]))
          
        const { data: staticData, error } = await supabase.rpc('get_gtfs_static_data', { requested_trips: batchRequests })
        if (error) return new Response(error.message, { status: 500 })
        
        const staticMap = new Map(
          staticData.map((item: any) => [`${item.trip_id}_${item.stop_sequence}`, item])
        )
  
        const timeToSeconds = (timeStr: string) => {
          const [h, m, s] = timeStr.split(':').map(Number)
          return h * 3600 + m * 60 + s
        };
  
        const timestampToSecondsOfDay = (timestamp: number) => {
          const date = new Date(timestamp * 1000)
          const plTime = date.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour12: false });
          return timeToSeconds(plTime)
        }
  
        const output: Vehicle[] = []
        for (const id in vehiclesMap) {
          const v = vehiclesMap[id]
          const position = v.position
          const update = v.tripUpdate
  
          const tripId = position?.trip?.tripId || update?.trip?.tripId
          const stopSeq = position?.currentStopSequence ?? update?.stopTimeUpdate?.[0]?.stopSequence
          
          const staticInfo: any = staticMap.get(`${tripId}_${stopSeq+1}`)
          if (!staticInfo) continue
  
  
  
          const nowTimestamp = Math.floor(Date.now() / 1000)
          
          let delay = 0
          let timeToDep = 0
          const realtimeTime = update?.stopTimeUpdate?.[0]?.arrival?.time || position?.timestamp
          if (realtimeTime && staticInfo.arrival_time) {
            const realSec = timestampToSecondsOfDay(parseInt(realtimeTime))
            const statSec = timeToSeconds(staticInfo.arrival_time)
            delay = realSec - statSec

            if (stopSeq && stopSeq > 1) {
              timeToDep = 0 
            } else {
              timeToDep = parseInt(realtimeTime) - nowTimestamp
              if (timeToDep < 0) timeToDep = 0
            }
          }
  
  
          output.push({
            vehId: parseInt(position?.vehicle?.label || update?.vehicle?.label || '0'),
            lineNum: staticInfo.route_short_name,
            dirType: staticInfo.direction_id === 0 ? 'T' : 'P',
            routeId: parseInt(tripId.split('_')[1] || '0'),
            lng: position?.position?.longitude || 0.0,
            lat: position?.position?.latitude || 0.0,
            bearing: position?.position?.bearing || 0.0,
            delay: delay,
            state: position?.currentStatus,
            dest: staticInfo.trip_headsign,
            timeToDep: timeToDep,
            vehType: staticInfo.route_type === 0 || staticInfo.route_type === 1 ? 'T' : 'A'
          })
        }

        VEHICLES_CACHE.vehicleData = output
        VEHICLES_CACHE.meta = Math.floor(Date.now()/1000)
      }

      return new Response(JSON.stringify(VEHICLES_CACHE.vehicleData), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      })
    }

    // /old_vehicles
    if (path === '/old_vehicles') {
      const upstreamUrl = `http://rozklady.lodz.pl/myBusServices/SchedulesService.svc/GetVehicles`
      return await fetchAndParseUpstream(upstreamUrl, parseVehicleXML, null, supabase)
    }

    // /vehicles/{vehicleId}/next-stops
    let mNextStops = path.match(/^\/vehicles\/([^/]+)\/next_stops$/)
    if (mNextStops) {
      const vehicleId = mNextStops[1]

      if (vehicleId.includes(',')) {
        return apiError(400, 'MULTIPLE_IDS_NOT_ALLOWED', 'next-stops endpoint accepts only single vehicleId')
      }

      let sessionCookie = ''
      
      try {
        const initResponse = await fetch('http://rozklady.lodz.pl/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
          }
        })
        
        const setCookieHeader = initResponse.headers.get('set-cookie')
        if (setCookieHeader) {
          sessionCookie = setCookieHeader.split(';')[0];
        }
      } catch (e) {
        console.error('Nie udało się pobrać ciasteczka sesji:', e)
      }

      const rawData = await fetch('http://rozklady.lodz.pl/Home/CNR_GetVehicleTimeTable', {
        method: 'POST',
        headers: {
          'Accept': 'application/xml, text/xml, */*; q=0.01',
          'Accept-Language': 'en-US;q=0.6',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': 'http://rozklady.lodz.pl',
          'Referer': 'http://rozklady.lodz.pl/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
          'Connection': 'keep-alive',
          'Cookie': sessionCookie || 'ASP.NET_SessionId=bh4heyp4q1o43jrt0251elo2'
        },
        body: `n=${vehicleId}`
      })
      
      const dataXML = await rawData.text()

      let parsed
      try {
        parsed = await parseVehicleNextStopsXML(dataXML, null, supabase)
      } catch {
        return apiError(500, 'XML_PARSE_ERROR', 'failed to parse upstream xml')
      }

      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }



    // ===== VEHICLE LIST =====
    // /list
    if (path === '/list') {
      const rawData = await fetch('http://rozklady.lodz.pl/Home/GetRouteList')
      const jsonData: [number, string[]][] = await rawData.json()

      return new Response(JSON.stringify(parseVehicleList(jsonData)), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      })
    }

    return apiError(404, 'NOT_FOUND', 'The requested endpoint does not exist')
  }
}



// ── POMOCNICZA FUNKCJA DO POBIERANIA Z ZEWNĘTRZNEGO API ─────────────────
async function fetchAndParseUpstream(url: string, parserFn: Function, args: any, supabase: SupabaseClient): Promise<Response> {
  const targetDate = new Date(2019, 10, 27);
  const age = String(Math.floor((Date.now() - targetDate.getTime()) / (1000 * 60 * 60 * 24)));

  let upstream: Response;
  try {
    upstream = await fetch(url, {
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

  let data;
  try {
    data = await parserFn(xmlText, args, supabase);
  } catch {
    return apiError(500, 'XML_PARSE_ERROR', 'failed to parse upstream xml');
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}



// ===== XML PARSERS =====
async function parseStopXML(xmlText: string, args?: any) {
  const timetable: BusStopTimetable = {
    stopID: args[0], stopCode: args[1] || 0, name: 'N/A', dayType: 0, dayName: 'N/A', serverTime: 'N/A', departs: []
  }

  let currentRoute = {
    busLine: '',
    dest: '',
    vehType: '',
    feat: ''
  }

  await new HTMLRewriter()
    .on('Schedules', {
      element(el) {
        timetable.serverTime = el.getAttribute('time') || ''
      }
    })
    .on('Stop', { 
      element(el) {
        timetable.name = el.getAttribute('name') || ''
      }
    })
    .on('Day', {
      element(el) {
        timetable.dayName = el.getAttribute('desc') || ''
        timetable.dayType = Number(el.getAttribute('type'))
      }
    })
    .on('R', {
      element(el) {
        currentRoute = {
          busLine: el.getAttribute('nr') || '',
          dest: el.getAttribute('dir') || 'N/A',
          vehType: el.getAttribute('vt') || 'N/A',
          feat: el.getAttribute('vuw') || '',
        }
      },
    })
    .on('S', {
      element(el) {
        timetable.departs.push({
          routeID:            Number(el.getAttribute('id')),
          departTimeInSec:    Number(el.getAttribute('s')),
          dest:               currentRoute.dest,
          dirType:            el.getAttribute('veh') || 'N/A',
          vehType:            currentRoute.vehType,
          busStopID:          args[0],
          timeDepPredMode:    Number(el.getAttribute('m')),
          feat:               currentRoute.feat,
          departTimeFormated: el.getAttribute('t') || '',
          vehId:              Number(el.getAttribute('nb')),
          busLine:            currentRoute.busLine,
        })
      }
    })
    .transform(new Response(xmlText, { headers: { 'content-type': 'text/xml' } }))
    .arrayBuffer()

  return timetable
}

async function parseVehicleXML(xmlText: string, args?: any) {
  const vehicles: any[] = [];

  await new HTMLRewriter()
    .on('V', {
      element(el) {
        vehicles.push({
          vehId:        Number(el.getAttribute('id')),
          sideNum:      Number(el.getAttribute('nb')),
          lineNum:      el.getAttribute('nr')?.trim()  || '',
          routeVar:     el.getAttribute('wt')?.trim()  || '',
          dirType:      el.getAttribute('kr')          || '',
          routeId:      Number(el.getAttribute('ik')),
          lp:           Number(el.getAttribute('lp')),
          distFromStop: Number(el.getAttribute('dp')),
          distToStop:   Number(el.getAttribute('dw')),
          lng:          Number(el.getAttribute('x')),
          lat:          Number(el.getAttribute('y')),
          prevLng:      Number(el.getAttribute('px')),
          prevLat:      Number(el.getAttribute('py')),
          delay:        Number(el.getAttribute('o')),
          stat:         Number(el.getAttribute('s')),
          departHour:   el.getAttribute('p')           || '',
          dest:         el.getAttribute('op')          || '',
          feat:         el.getAttribute('c')           || '',
          nextRouteId:  Number(el.getAttribute('nk')),
          nextLineNum:  el.getAttribute('nnr')?.trim() || '',
          nextRouteVar: el.getAttribute('nwt')?.trim() || '',
          nextDirType:  el.getAttribute('nkr')         || '',
          nextDest:     el.getAttribute('nop')         || '',
          timeToDep:    Number(el.getAttribute('is')),
          vehType:      el.getAttribute('vt')          || 'A',
          courseId:     el.getAttribute('kwi')?.trim() || '',
        });
      },
    })
    .transform(new Response(xmlText, { headers: { 'content-type': 'text/xml' } }))
    .arrayBuffer();

  return vehicles;
}

async function parseVehicleNextStopsXML(xmlText: string, args?: any, supabase?: SupabaseClient) {
  const timetable: VehicleTimetable = { routeId: 0, busLine: 'N/A', vehType: 'N/A', dest: 'N/A', dep: [] }

  await new HTMLRewriter()
    .on('Schedules', {
      element(el) {
        timetable.routeId = Number(el.getAttribute('id'))
        timetable.busLine = el.getAttribute('nr')?.trim() || 'N/A'
        timetable.vehType = Number(el.getAttribute('type')) === 3 ? 'A' : 'T'
        timetable.dest    = el.getAttribute('o') || 'N/A'
      },
    })
    .on('Stop', {
      element(el) {
        const s = Number(el.getAttribute('s'));
        timetable.dep.push({
          no:                 Number(el.getAttribute('lp')),
          busStopID:          Number(el.getAttribute('id')),
          busStopName:        el.getAttribute('name') || 'N/A',
          hrsToDep:           Math.floor(s / 3600),
          minToDep:           Math.floor((s % 3600) / 60),
          secToDep:           s % 60,
          timeToDepInSeconds: s,
          timeDepPredMode:    Number(el.getAttribute('m')),
        })
      }
    })
    .transform(new Response(xmlText, { headers: { 'content-type': 'text/xml' } }))
    .arrayBuffer()

  return timetable
}

function parseVehicleList(data: [number, string[]][], args?: any) {
  const result: { buses: string[]; trams: string[] } = { buses: [], trams: [] }

  for (const [type, items] of data as [number, string[]][]) {
    const lines: string[] = []
    for (let i = 1; i < items.length; i += 2) {
      lines.push(items[i].replace(/\.$/, ''))
    }
    if (type === 0) result.buses = lines
    if (type === 2) result.trams = lines
  }

  return result
}



// ===== ERROR + CORS UTILS =====
function apiError(status: number, code: string, message: string) {
  return new Response(
    JSON.stringify({ error: { code, message, status } }),
    { status, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
  )
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}