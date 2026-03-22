// @ts-nocheck
import { useTheme } from '../hooks/useTheme'
import { useEffect, useRef, useState } from "react"
import maplibregl, { Map as MapLibreMap, Marker} from "maplibre-gl"
import gsap from "gsap"

import "maplibre-gl/dist/maplibre-gl.css"
import { osmProviders } from '../lib/osmProviders'
import stops from '../lib/stops'
import BottomSheet from '../components/BottomSheet'
import Menu from '../components/Menu'
import type { Vehicle, RoutePolyline, BusStopData, Route, LiveVehiclesList } from "../types"

const REFRESH = 60

export default function App() {
  const { isDark, toggle } = useTheme()

  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<number, Marker>>(new Map())
  const BSMarkersRef = useRef<Map<number, Marker>>(new Map())
  const countdownRef = useRef<any>(null)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [liveVehiclesList, setLiveVehiclesList] = useState<LiveVehiclesList>({ buses: [], trams: [] })
  const [shownLines, setShownLines] = useState<string[]>(["92A", "92B", "82B", "69A", "69B", "72A", "72B", "75A", "75B"])
  const [routePolyline, setRoutePolyline] = useState<RoutePolyline[]>([])
  const [routeBusStops, setRouteBusStops] = useState<BusStopData[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedBusStop, setSelectedBusStop] = useState<BusStopData | null>(null)

  // load map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      center: [19.49589069067231, 51.7323631400332],
      zoom: 11,
      style: "https://tiles.openfreemap.org/styles/liberty",
    })

    map.current.addControl(new maplibregl.NavigationControl({ showZoom: false, visualizePitch:true }), "top-right")

    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat
      console.log(`Kliknięto: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // change dark/light map style
  useEffect(() => {
    if (!map.current) return

    map.current.once("styledata", () => {
      markersRef.current.forEach((marker) => {
        marker.addTo(map.current!)
      })

      if (routePolyline.length) {
        addRoute(routePolyline, routeBusStops)
      }
    })

    map.current.setStyle(isDark ? osmProviders.maptilerDark : osmProviders.OFMLiberty)
  }, [isDark])

  // fetch vehicles
  useEffect(() => {
    let isRunning = false
    let count = REFRESH

    fetchLiveVehiclesList()

    const fetchData = async () => {
      if (isRunning) return
      isRunning = true
      await fetch("https://v2.szymon-pira.workers.dev/vehicles")
        .then(res => res.json())
        .then(data => setVehicles(data))
      isRunning = false
    }

    fetchData()

    const interval = setInterval(() => {
      count -= 1
      if (countdownRef.current) {
        countdownRef.current.textContent = count
      }
      if (count <= 0) {
        count = REFRESH
        fetchData()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // update or create markers when vehicles change
  useEffect(() => {
    if (!map.current) return

    const currentIds = new Set(vehicles.map(v => v.vehId))

    // remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })

    vehicles.forEach(vehicle => {
      if (!shownLines.includes(vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum)) return

      const isBus = vehicle.vehType === "A"
      const color = isBus ? "#18295e" : "#7e2014"

      const el = document.createElement("div")
      el.style.cssText = `cursor: pointer; opacity: 0.95; zIndex: 10;`

      el.innerHTML = `
        <svg width="78" height="100%" viewBox="0 0 79 61" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));">
          <path d="M2.622,57.243C2.207,57.706 1.549,57.866 0.968,57.643C0.387,57.421 0.004,56.863 0.005,56.24C0.018,45.523 0.054,15.845 0.067,4.495C0.07,2.011 2.084,0 4.567,-0C18.331,0 59.8,0 73.571,0C76.056,0 78.071,2.015 78.071,4.5C78.071,12.62 78.071,29.63 78.071,37.75C78.071,40.235 76.056,42.25 73.571,42.25C61.151,42.25 26.739,42.25 18.053,42.25C16.773,42.25 15.554,42.795 14.7,43.749C12.046,46.714 6.083,53.376 2.622,57.243Z" style="fill:${color};fill-rule:nonzero;"/>
        </svg>
        <div id="dest" style="position:absolute; width:max-content; height:15px; bottom:62px; background:${color}; color:#fff; font-size:.7rem; font-weight:700; line-height:11px; left:50%;
          transform:translate(-50%); padding:2px 3px; border-radius:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">
            ${vehicle.dest ? vehicle.dest : vehicle.nextDest}
        </div>
        <div style="position: absolute; width:100%; height:42px; bottom:18px; display:flex; flex-direction:column; justify-content: space-between; padding: 4px 6px;">
          <div style="height:15px; display:flex; justify-content: space-between; align-items: start;">
            ${isBus ? `<i class='bx bxs-bus' style="font-size: 1.05rem; color: #fff;"></i>` : `<i class='bx bxs-train' style="font-size: 1.2rem; color: #fff;"></i>`}
            <p style="color:#fff; font-size: .55rem; font-weight: 600; line-height:10px; letter-spacing: -1px" >
              ${vehicle.sideNum}
            </p>
            <p id="lineNum" style="color:#fff; font-size: .95rem; font-weight: 800; letter-spacing: -1px; line-height: 15px" >
              ${vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum}
            </p>
          </div>
          <div id="delayCont" style="height:15px; display:flex; justify-content: space-between; align-items: center;">
            ${vehicle.timeToDep === 0 ? `
                <i class='bx bx-up-arrow-alt' style="color:${vehicle.delay > 0 ? "#0f0" : "#f00"}; font-size:1rem;"></i>
              ` : `
                <i class='bx bx-stopwatch' style="font-size:.9rem; color:#fff;"></i>
              `}
            <p style="font-size:.75rem; color:#fff;">${formatTime(vehicle.delay)}<p>
          </div>
        </div>
      `

      const existingMarker = markersRef.current.get(vehicle.vehId)

      if (existingMarker) {
        const current = existingMarker.getLngLat()
        gsap.to(current, {
          lng: vehicle.lng,
          lat: vehicle.lat,
          duration: .4,
          ease: "power2.inOut",
          onUpdate: () => {
            existingMarker.setLngLat([current.lng, current.lat])
          }
        })
        
        // update element content
        const existingEl = existingMarker.getElement()
        const existingDest = existingEl.querySelector("#dest")
        const existingLineNum = existingEl.querySelector("#lineNum")
        const existingDelayCont = existingEl.querySelector("#delayCont")

        if(existingDest) existingDest.textContent = vehicle.dest ? vehicle.dest : vehicle.nextDest
        if(existingLineNum) existingLineNum.textContent = vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum
        if(existingDelayCont) existingDelayCont.innerHTML = `
          ${vehicle.timeToDep === 0 ? `
              <i class='bx bx-up-arrow-alt' style="color:${vehicle.delay > 0 ? "#0f0" : "#f00"}; font-size:1rem;"></i>
            ` : `
              <i class='bx bx-stopwatch' style="font-size:.9rem; color:#fff;"></i>
            `}
          <p style="font-size:.75rem; color:#fff;">${formatTime(vehicle.delay)}<p>
        `

      } else {
        const marker = new Marker({ element: el, anchor: "bottom-left" })
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map.current!)
        
        gsap.from(el, {
          scale: .3,
          opacity: 0,
          duration: .4,
          ease: "power2.inOut"
        })

        el.addEventListener("click", (e) => {
          e.stopPropagation()
          setSelectedVehicle(vehicle)
          getRoute(vehicle)
        })

        markersRef.current.set(vehicle.vehId, marker)
      }
    })
  }, [vehicles])

  // FUNCTIONS
  async function fetchLiveVehiclesList() {
    await fetch("https://v2.szymon-pira.workers.dev/list")
      .then(res => res.json())
      .then(data => setLiveVehiclesList(data))
  }

  async function getRoute(veh: Vehicle) {
    console.log("gr", veh.routeId)
    const stopsMap = new Map(stops.map(s => [s.id, s]))
    const polyline: RoutePolyline[] = []
    const routeStops: BusStopData[] = []
    const processedStopIds = new Set()

    const routeData: Route = await fetch(`https://v2.szymon-pira.workers.dev/routes/${veh.routeId ? veh.routeId : veh.nextRouteId}`)
      .then(res => res.json())
    
    routeData.stops.forEach(segment => {
      const startStop = stopsMap.get(segment.startStopID)

      if (startStop) {
        polyline.push([startStop.y, startStop.x ])

        if (!processedStopIds.has(segment.startStopID)) {
          routeStops.push({
            id: startStop.id,
            n: startStop.n,
            x: startStop.x,
            y: startStop.y,
            z: startStop.z
          })
          processedStopIds.add(segment.startStopID)
        }

        if (segment.geoPoints && segment.geoPoints.length > 0) {
          segment.geoPoints.forEach(pt => {
            polyline.push([ pt.y, pt.x ])
          })
        }
      }
    })

    addRoute(polyline, routeStops)

    setRouteBusStops(routeStops)
    setRoutePolyline(polyline)
  }

  function addRoute(polyline: [number, number][], busStops: BusStopData[]): void {
    if (map.current?.getLayer("route-line")) map.current?.removeLayer("route-line")
    if (map.current?.getSource("route"))     map.current?.removeSource("route")

    map.current?.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: polyline.map(([lat, lng]) => [lng, lat])
        },
      },
    })

    map.current?.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round"
      },
      paint: {
        "line-color": "#333",
        "line-width": 4
      }
    })

    BSMarkersRef.current.forEach((marker, id) => {
      marker.remove()
      BSMarkersRef.current.delete(id)
    })

    busStops.forEach(stop => {
      let gradient = "linear-gradient(180deg,rgba(255, 234, 0, 1) 1%, rgba(224, 191, 0, 1) 100%)"

      const el = document.createElement('div')
      el.style.cssText = `width:18px; height:18px; border-radius:100%; background:${gradient}; cursor:pointer; font-size: 0rem; border: 2px solid #666; zIndex: 1;`
      el.textContent = '.'

      const marker = new Marker({ element: el, anchor: "center"})
        .setLngLat([stop.x, stop.y])
        .addTo(map.current!)

      BSMarkersRef.current.set(stop.id, marker)

      el.addEventListener("click", (e) => {
        e.stopPropagation()
        setSelectedBusStop(stop)
      })
    })
  }

  function removeRoute(): void {
    if (map.current?.getLayer("route-line")) map.current?.removeLayer("route-line")
    if (map.current?.getSource("route"))     map.current?.removeSource("route")

    BSMarkersRef.current.forEach((marker, id) => {
      marker.remove()
      BSMarkersRef.current.delete(id)
    })
  }

  console.log(liveVehiclesList)

  return (
    <div className="h-dvh bg-white dark:bg-neutral-900 text-black dark:text-white">
      <BottomSheet>
        <Menu />
      </BottomSheet>


      <button className="absolute top-0 z-10 bg-red-700 m-3 px-2 py-1 text-white rounded" onClick={() => toggle(isDark ? "light" : "dark")}>
        {isDark ? "light" : "dark"}
      </button>
      <span className="absolute top-0 z-10 bg-red-700 text-white m-3 ml-20 px-2 py-1 rounded" ref={countdownRef} />

      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4 min-w-56 max-w-xs">
          <button className="absolute top-2 right-3 text-gray-400 hover:text-gray-600" onClick={() => setSelectedVehicle(null)}>✕</button>
          <div className="font-bold text-lg mb-1">{selectedVehicle.vehType === "A" ? "🚌" : "🚋"} Linia {selectedVehicle.lineNum}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <div>Kierunek: <span className="font-medium">{selectedVehicle.dest}</span></div>
            <div>Boczny nr: {selectedVehicle.sideNum}</div>
            <div>
              Opóźnienie:{" "}
              <span className={selectedVehicle.delay > 0 ? "text-red-500" : selectedVehicle.delay < 0 ? "text-green-500" : "text-gray-500"}>
                {selectedVehicle.delay > 0 ? `+${selectedVehicle.delay} min` : selectedVehicle.delay < 0 ? `${selectedVehicle.delay} min` : "punktualnie"}
              </span>
            </div>
            <div>Trasa: {selectedVehicle.routeVar}</div>
            {selectedVehicle.nextLineNum && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-700 text-xs text-gray-500">
                Następna: linia {selectedVehicle.nextLineNum} → {selectedVehicle.nextDest}
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-dvh" />
    </div>
  )
}

function formatTime(sec: number): string {
  sec = Math.abs(sec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60

  const pad = (n: number) => String(n).padStart(2, "0")

  return pad(h) + ":" + pad(m) + ":" + pad(s)
}