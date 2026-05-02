import { useTheme } from '../hooks/useTheme'
import { useEffect, useRef } from "react"
//@ts-ignore
import maplibregl, { Map as MapLibreMap, Marker} from "maplibre-gl"
import gsap from "gsap"

import "maplibre-gl/dist/maplibre-gl.css"
import { osmProviders } from '../lib/osmProviders'
import stops from '../lib/stops'
import BottomSheet from '../components/BottomSheet'
import Menu from '../components/Menu'
import ThemeToggle from '../components/ThemeToggle'
import LoadingScreen from './../components/LoadingScreen.tsx'

import type { Vehicle, RoutePolyline, BusStopData, Route } from "../types"
import { useAppStore } from "../lib/store"




const REFRESH = import.meta.env.VITE_REFRESH

export default function App() {
  const { isDark, toggle } = useTheme()


  const { selectedVehicle, setSelectedVehicle, selectedBusStop, setSelectedBusStop, map, setMap, setLiveVehiclesList,
    setRoutePolyline, setRouteBusStops, setMenuState, vehicles, setVehicles, shownLines } = useAppStore()

  const mapContainer = useRef<HTMLDivElement | null>(null)
  const markersRef = useRef<Map<number, Marker>>(new Map())
  const BSMarkersRef = useRef<Map<number, Marker>>(new Map())
  const countdownRef = useRef<any>(null)

  const polylineRef = useRef<RoutePolyline[] | null>(null)
  const routeStopsRef = useRef<BusStopData[] | null>(null)
  const currentRouteIdRef = useRef<number | null>(null)
  const selectedBusStopRef = useRef<BusStopData | null>(selectedBusStop)


  useEffect(() => {
    selectedBusStopRef.current = selectedBusStop
  }, [selectedBusStop])

  // load map
  useEffect(() => {
    if (map || !mapContainer.current) return

    let mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      center: [19.49589069067231, 51.7323631400332],
      zoom: 11,
      style: isDark ? osmProviders.maptilerDark : osmProviders.maptilerLight,
    })
    
    mapInstance.addControl(new maplibregl.NavigationControl({ showZoom: false, visualizePitch: true }), "top-right")
    
    // mapInstance.on("click", (e) => {
    //   const { lng, lat } = e.lngLat
    //   console.log(`Kliknięto: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    // })
    
    setMap(mapInstance)

    return () => {
      mapInstance.remove()
    }
  }, [])

  // change dark/light map style
  useEffect(() => {
    if (!map) return

    map.once("styledata", () => {
      markersRef.current.forEach((marker) => {
        marker.addTo(map!)
      })

      // if (routePolyline.length) {
      //   addRoute(routePolyline, routeStops)
      // }
    })

    map.setStyle(isDark ? osmProviders.maptilerDark : osmProviders.OFMLiberty)
  }, [isDark])

  // fetch vehicles
  useEffect(() => {
    let isRunning = false
    let count = REFRESH

    fetchLiveVehiclesList()

    const fetchData = async () => {
      if (isRunning) return
      isRunning = true
      await fetch(import.meta.env.VITE_API_URL_VEHICLES)
        .then(res => res.json())
        .then(data => {
          if (data?.error) throw new Error("Cannot download data", data.error)
          setVehicles(data)
        })
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

  // update or create markers when vehicles changes
  useEffect(() => {
    // console.log(selectedVehicle)
    if (!map) return

    const currentIds = new Set(vehicles.map(v => v.vehId))

    // remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        const element = marker.getElement()
        if (map.getBounds().contains(marker.getLngLat())) {
          gsap.to(element, {
            scale: 0,
            opacity: 0,
            duration: 0.15,
            ease: "power2.in",
            transformOrigin: "bottom left",
            onComplete: () => {
              markersRef.current.delete(id)
              marker.remove()
            },
          })
        } else {
          markersRef.current.delete(id)
          marker.remove()
        }
      }
    })

    vehicles.forEach(vehicle => {
      // if(vehicle.sideNum === selectedVehicle?.sideNum) setSelectedVehicle(vehicle)

      const existingMarker = markersRef.current.get(vehicle.vehId)
      
      if (!shownLines.includes(vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum)) {
        if (existingMarker) {
          const element = existingMarker.getElement().firstElementChild as HTMLElement

          if (map.getBounds().contains(existingMarker.getLngLat())) {
            gsap.to(element, {
              scale: 0,
              opacity: 0,
              duration: 0.15,
              ease: "power2.in",
              transformOrigin: "bottom left",
              onComplete: () => {
                markersRef.current.delete(vehicle.vehId)
                existingMarker.remove()
              },
            })
          } else {
            markersRef.current.delete(vehicle.vehId)
            existingMarker.remove()
          }
        }
        return
      }

      const isBus = vehicle.vehType === "A"
      let color = isBus ? "#18295e" : "#7e2014"

      function cropLine(str: string | undefined): string {
        if (/^[a-zA-Z]+$/.test(str || "") && str?.length===1) return str
        return str ? str.replace(/[a-zA-Z]$/, "") : ""
      }

      if (vehicle.vehType === "A") {
        if (cropLine(selectedVehicle?.lineNum ? selectedVehicle?.lineNum : selectedVehicle?.nextLineNum) === cropLine(vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum)) color = "#2a4aa3"
        if (selectedVehicle?.sideNum === vehicle.sideNum) color = "#084202"
      } else {
        if (cropLine(selectedVehicle?.lineNum ? selectedVehicle?.lineNum : selectedVehicle?.nextLineNum) === cropLine(vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum)) color = "#af4202"
        if (selectedVehicle?.sideNum === vehicle.sideNum) color = "#084202"
      }

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
        const existingSvg = existingEl.querySelector("#svg")

        existingEl.style.zIndex = String((selectedVehicle?.sideNum === vehicle.sideNum) ? 10 : 1)
        
        if(existingSvg) {
          const path = existingSvg.querySelector("path")
          if (path) path.style.fill = color
        }

        if(existingDest) {
          //@ts-ignore
          existingDest.style.background = color
          existingDest.textContent = vehicle.dest ? vehicle.dest : vehicle.nextDest
        }
        if(existingLineNum) existingLineNum.textContent = vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum
        if(existingDelayCont) existingDelayCont.innerHTML = `
          ${vehicle.timeToDep === 0 ? `
              <i class='bx bx-up-arrow-alt' style="color:${vehicle.delay < 0 ? "#0f0" : "#f00"}; font-size:1rem;"></i>
            ` : `
              <i class='bx bx-stopwatch' style="font-size:.9rem; color:#fff;"></i>
            `}
          <p style="font-size:.75rem; color:#fff;">${formatTime(vehicle.delay)}<p>
        `

      } else {
        const el = document.createElement("div")
        el.style.cssText = `cursor: pointer; opacity: 0.95; zIndex: 1;`

        el.innerHTML = `
          <div data-ph-capture-attribute-element-name="dir: ${vehicle.dest ? vehicle.dest : vehicle.nextDest}; num: ${vehicle.sideNum}; route: ${vehicle.routeId || vehicle.nextRouteId}; line: ${vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum}" data-ph-capture-attribute-section="map">
            <svg id="svg" width="78" height="100%" viewBox="0 0 79 61" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));">
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
          </div>
        `

        const marker = new Marker({ element: el, anchor: "bottom-left" })
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map!)
        
        gsap.from(el, {
          scale: .3,
          opacity: 0,
          duration: .15,
          transformOrigin: "bottom left",
          ease: "power2.inOut"
        })

        el.addEventListener("click", (e) => {
          e.stopPropagation()
          setSelectedVehicle(vehicle)
          createRoute(vehicle)
          setMenuState(4)

          map?.easeTo({
            center: [vehicle.lng, vehicle.lat],
            offset: [0, -150],
            duration: 300,
          })
        })

        markersRef.current.set(vehicle.vehId, marker)
      }
    })
  }, [vehicles, selectedVehicle, shownLines])
  
  // change stop icon color on map wether selectedBusStop changes
  useEffect(() => {
    BSMarkersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      const isSelected = id === selectedBusStop?.id

      el.style.background = isSelected
        ? "linear-gradient(180deg,rgba(54, 215, 255, 1) 1%, rgba(27, 187, 227, 1) 100%)"
        : "linear-gradient(180deg,rgba(255, 234, 0, 1) 1%, rgba(224, 191, 0, 1) 100%)"
    })
  }, [selectedBusStop])


  // FUNCTIONS
  async function fetchLiveVehiclesList() {
    await fetch(import.meta.env.VITE_API_URL_LINES_LIST)
      .then(res => res.json())
      .then(data => setLiveVehiclesList(data))
  }

  async function createRoute(veh: Vehicle) {
    // console.log("selectedBusStopRef: ", selectedBusStopRef)
    const routeId = veh.routeId || veh.nextRouteId
    // console.log(currentRouteIdRef.current === routeId, currentRouteIdRef.current, routeId, veh.routeId, veh.nextRouteId)
    if (currentRouteIdRef.current === routeId) return

    currentRouteIdRef.current = routeId

    const stopsMap = new Map(stops.map(s => [s.id, s]))
    const polyline: RoutePolyline[] = []
    const routeStops: BusStopData[] = []
    const processedStopIds = new Set()

    const routeData: Route = await fetch(import.meta.env.VITE_API_URL_ROUTE+routeId)
      .then(res => res.json())


    routeData.stops.forEach(segment => {
      const startStop = stopsMap.get(segment.startStopID)
      if (!startStop) return

      polyline.push([startStop.y, startStop.x])

      if (!processedStopIds.has(segment.startStopID)) {
        routeStops.push({ id: startStop.id, n: startStop.n, x: startStop.x, y: startStop.y, z: startStop.z })
        processedStopIds.add(segment.startStopID)
      }

      segment.geoPoints?.forEach(pt => polyline.push([pt.y, pt.x]))
    })

    polylineRef.current = polyline
    routeStopsRef.current = routeStops

    // Usuń starą warstwę przed dodaniem nowej
    removeRoute(false)
    

    map?.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: polyline.map(([lat, lng]) => [lng, lat])
        }
      }
    })

    map?.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#ff5b03", "line-width": 4 }
    })

    routeStops.forEach((stop, index) => {
      let gradient = "linear-gradient(180deg,rgba(255, 234, 0, 1) 1%, rgba(224, 191, 0, 1) 100%)"
      if (stop.id === selectedBusStopRef.current?.id) gradient = "linear-gradient(180deg,rgba(54, 215, 255, 1) 1%, rgba(27, 187, 227, 1) 100%)"
      if (index === 0) gradient = "linear-gradient(180deg,rgba(0, 204, 24, 1) 0%, rgba(0, 176, 0, 1) 100%)"
      if (index === routeStops.length-1) gradient = "linear-gradient(180deg,rgba(224, 18, 18, 1) 0%, rgba(179, 32, 32, 1) 100%)"

      const el = document.createElement('div')
      el.style.cssText = `width:18px; height:18px; border-radius:100%; background:${gradient}; cursor:pointer; font-size:0rem; border:2px solid #666; zIndex:1;`
      el.textContent = stop.id+"; "+stop.n

      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat([stop.x, stop.y])
        .addTo(map!)

      BSMarkersRef.current.set(stop.id, marker)

      el.addEventListener("click", (e) => {
        e.stopPropagation()
        setSelectedBusStop(stop)
        setMenuState(3)
      })
    })

    setRouteBusStops(routeStops)
    setRoutePolyline(polyline)
  }

  function removeRoute(resetRef = true): void {
    if (map?.getLayer("route-line")) map.removeLayer("route-line")
    if (map?.getSource("route"))     map.removeSource("route")

    BSMarkersRef.current.forEach(marker => marker.remove())
    BSMarkersRef.current.clear()

    if (resetRef) currentRouteIdRef.current = null
  }

  return (
    <div className="h-dvh bg-white dark:bg-neutral-900 text-black dark:text-white">
      {vehicles.length === 0 && <div className='w-full h-dvh z-1000 absolute flex justify-center items-center'>
        <LoadingScreen />
      </div>}

      <BottomSheet>
        <Menu BSMarkersRef={BSMarkersRef} currentRouteIdRef={currentRouteIdRef}/>
      </BottomSheet>

      <div className='absolute top-4 left-4 z-10000 flex flex-row gap-1'>
        <ThemeToggle isDark={isDark} toggle={toggle} />
        <div className='bg-white h-9 w-9 dark:bg-zinc-900 backdrop-blur-md border border-zinc-200 dark:border-zinc-800
          rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 z-10 text-[13px] font-bold tracking-tight
          text-zinc-700 dark:text-zinc-200 min-w-9' ref={countdownRef}></div>
      </div>

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