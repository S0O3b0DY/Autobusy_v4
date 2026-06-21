// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useEffect, useRef } from "react"
import { useTheme } from '../hooks/useTheme'
import { useAppStore } from "../lib/store"
import { useAuth } from '../contexts/AuthContext'

// components
import BottomSheet from '../components/BottomSheet'
import Menu from '../components/Menu'
import ThemeToggle from '../components/ThemeToggle'
import LoadingScreen from './../components/LoadingScreen'
import ChangeLang from './../components/ChangeLang'

// types
import type { Vehicle, RoutePolyline, BusStopData, Route } from "../types"
import type { StopIconType } from "../types"

// constants
import stops from '../const/stops.ts'
import { STOP_ICON_COLORS, VEHICLE_COLORS } from "../const/colors.ts"
import { osmProviders } from '../lib/osmProviders'
import "maplibre-gl/dist/maplibre-gl.css"

// other
import maplibregl, { Map as MapLibreMap, Marker, type GeoJSONSource} from "maplibre-gl"
import { dbF } from '../lib/firebase.ts'
import gsap from "gsap"
import { doc, setDoc } from "firebase/firestore"
import posthog from "posthog-js"
import { Navigate } from "react-router-dom"





const REFRESH = import.meta.env.VITE_REFRESH
export const BUS_STOPS_SOURCE = 'bus-stops'
export const BUS_STOPS_LAYER  = 'bus-stops-layer'

export default function App() {

  const { userLoggedIn, user } = useAuth()
  const { isDark, toggle } = useTheme()
  const { selectedVehicle, setSelectedVehicle, selectedBusStop, setSelectedBusStop, map, setMap, setLiveVehiclesList,
    setRoutePolyline, setRouteBusStops, setMenuState, vehicles, setVehicles, shownLines, favoriteStops } = useAppStore()
    
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const markersRef = useRef<Map<number, Marker>>(new Map())
  // const BSMarkersRef = useRef<Map<number, Marker>>(new Map())
  const countdownRef = useRef<any>(null)
  
  const polylineRef = useRef<RoutePolyline[] | null>(null)
  const routeStopsRef = useRef<BusStopData[] | null>(null)
  const currentRouteIdRef = useRef<number | null>(null)
  const selectedBusStopRef = useRef<BusStopData | null>(selectedBusStop)


  
  useEffect(() => {
    const save = async () => {
      const userRef = doc(dbF, "users", user.uid)
      
      await setDoc(userRef, { favoriteStops: favoriteStops }, { merge: true })
    }
    
    if (!userLoggedIn) return
    save()
  }, [favoriteStops])
  
  useEffect(() => {
    selectedBusStopRef.current = selectedBusStop
  }, [selectedBusStop])
  
  // load map
  useEffect(() => {
    if (map || !mapContainer.current) return

    let mapInstance = new MapLibreMap({
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

    mapInstance.on("load", async () => {

      const dpr = window.devicePixelRatio || 1
      const types: StopIconType[] = ['default', 'selected', 'first', 'last']
      await Promise.all(
        types.map(async (type) => {
          if (mapInstance.hasImage(`stop-${type}`)) return
          const img = await createStopIcon(type)
          mapInstance.addImage(`stop-${type}`, img, { pixelRatio: dpr })
        })
      )
    })
    
    setMap(mapInstance)

    return () => {
      mapInstance.remove()
    }
  }, [])

  // update map when ther is a change between dark/light app mode
  useEffect(() => {
    if (!map) return

    map.once("styledata", () => {
      markersRef.current.forEach((marker) => {
        marker.addTo(map!)
      })

      if (polylineRef.current?.length) {
        createRoute(selectedVehicle, true)
      }
    })

    map.setStyle(isDark ? osmProviders.maptilerDark : osmProviders.maptilerLight)
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
      let color = isBus
        ? (isDark ? VEHICLE_COLORS.dark.defaultBus : VEHICLE_COLORS.light.defaultBus)
        : (isDark ? VEHICLE_COLORS.dark.defaultTram : VEHICLE_COLORS.light.defaultTram)

      const cond1 = cropLine(selectedVehicle?.lineNum ? selectedVehicle?.lineNum : selectedVehicle?.nextLineNum) === cropLine(vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum)
      const cond2 = selectedVehicle?.sideNum === vehicle.sideNum

      if (vehicle.vehType === "A") {
        if (cond1) color = (isDark ? VEHICLE_COLORS.dark.busGroup : VEHICLE_COLORS.light.busGroup)
        if (cond2) color = (isDark ? VEHICLE_COLORS.dark.selectedBus : VEHICLE_COLORS.light.selectedBus)
      } else {
        if (cond1) color = (isDark ? VEHICLE_COLORS.dark.tramGroup : VEHICLE_COLORS.light.tramGroup)
        if (cond2) color = (isDark ? VEHICLE_COLORS.dark.selectedTram : VEHICLE_COLORS.light.selectedTram)
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

        existingEl.style.zIndex = String(cond1 ? 10 : 1)
        existingEl.onclick = (e) => {
          e.stopPropagation()
          setSelectedVehicle(vehicle)
          createRoute(vehicle)
          setMenuState(4)
          posthog.capture("clicked_on_vehicle", {
            line: vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum,
            destination: vehicle.dest ? vehicle.dest : vehicle.nextDest,
            number: vehicle.sideNum
          })

          map?.easeTo({
            center: [vehicle.lng, vehicle.lat],
            offset: [0, -150],
            duration: 300,
          })
        }
        
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="fill: ${vehicle.delay > 0 ? "#0f0" : "#f00"};transform: ;msFilter:;"><path d="M11 8.414V18h2V8.414l4.293 4.293 1.414-1.414L12 4.586l-6.707 6.707 1.414 1.414z"></path></svg>
            ` : `
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" style="fill: #fff;transform: ;msFilter:;"><path d="M12 5c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"></path><path d="M11 9h2v5h-2zM9 2h6v2H9zm10.293 5.707-2-2 1.414-1.414 2 2z"></path></svg>
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
                ${isBus ? (
                  `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" style="fill: #fff;transform: ;msFilter:;"><path d="M21 6.021c.003-.146-.007-1.465-1.3-2.735C18.427 2.036 17.143 2 17 2H6.996c-.239 0-1.493.063-2.708 1.302C3.036 4.578 3 5.859 3 6v3H2v3h1v6c0 .734.406 1.373 1 1.721V21a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h10v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.277A1.99 1.99 0 0 0 21 18v-6h1V9h-1V6.021zM9 4h6v2H9V4zM6.5 18a1.5 1.5 0 1 1 .001-3.001A1.5 1.5 0 0 1 6.5 18zm4.5-5H5V8h6v5zm6.5 5a1.5 1.5 0 1 1 .001-3.001A1.5 1.5 0 0 1 17.5 18zm1.5-5h-6V8h6v5z"></path></svg>`)
                  : (`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="fill: #fff;transform: ;msFilter:;"><path d="M16.375 2H7.621c-.224 0-1.399.065-2.503 1.351C4.031 4.616 4 5.862 4 6v11a2 2 0 0 0 2 2h1l-2 3h2.353l.667-1h8l.677 1H19l-2-3h1a2 2 0 0 0 2-2V6c.001-.188-.032-1.434-1.129-2.665C17.715 2.037 16.509 2 16.375 2zM10 4h4v2h-4V4zM7.5 17a1.5 1.5 0 1 1 .001-3.001A1.5 1.5 0 0 1 7.5 17zm9 0a1.5 1.5 0 1 1 .001-3.001A1.5 1.5 0 0 1 16.5 17zm1.5-5H6V8h12v4z"></path></svg>`)
                }
                <p style="color:#fff; font-size: .55rem; font-weight: 600; line-height:10px; letter-spacing: -1px" >
                  ${vehicle.sideNum}
                </p>
                <p id="lineNum" style="color:#fff; font-size: .95rem; font-weight: 800; letter-spacing: -1px; line-height: 15px" >
                  ${vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum}
                </p>
              </div>
              <div id="delayCont" style="height:15px; display:flex; justify-content: space-between; align-items: center;">
                ${vehicle.timeToDep === 0 ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="fill: ${vehicle.delay > 0 ? "#0f0" : "#f00"};transform: ;msFilter:;"><path d="M11 8.414V18h2V8.414l4.293 4.293 1.414-1.414L12 4.586l-6.707 6.707 1.414 1.414z"></path></svg>
                  ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: #fff;transform: ;msFilter:;"><path d="M12 5c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"></path><path d="M11 9h2v5h-2zM9 2h6v2H9zm10.293 5.707-2-2 1.414-1.414 2 2z"></path></svg>
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

        el.onclick = (e) => {
          e.stopPropagation()
          setSelectedVehicle(vehicle)
          createRoute(vehicle)
          setMenuState(4)
          posthog.capture("clicked_on_vehicle", {
            line: vehicle.lineNum ? vehicle.lineNum : vehicle.nextLineNum,
            destination: vehicle.dest ? vehicle.dest : vehicle.nextDest,
            number: vehicle.sideNum
          })

          map?.easeTo({
            center: [vehicle.lng, vehicle.lat],
            offset: [0, -150],
            duration: 300,
          })
        }

        markersRef.current.set(vehicle.vehId, marker)
      }
    })
  }, [vehicles, selectedVehicle, shownLines, isDark])
  
  // change stop icon color on map wether selectedBusStop changes
  useEffect(() => {
    const source = map?.getSource(BUS_STOPS_SOURCE) as GeoJSONSource | undefined
    if (!source) return

    const stops_list = routeStopsRef.current ?? []
    const total = stops_list.length
    const selectedId = selectedBusStop?.id

    source.setData({
      type: 'FeatureCollection',
      features: stops_list.map((stop, index) => {
        let iconType: StopIconType = resolveIconType(stop, index, total, selectedId)

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [stop.x, stop.y] },
          properties: {
            id:       stop.id,
            iconType: `stop-${iconType}`,
            stopJson: JSON.stringify(stop),
          },
        }
      }),
    })
  }, [selectedBusStop])


  // FUNCTIONS
  async function fetchLiveVehiclesList() {
    await fetch(import.meta.env.VITE_API_URL_LINES_LIST)
      .then(res => res.json())
      .then(data => setLiveVehiclesList(data))
  }

  async function createRoute(veh: Vehicle | null, onlyMapUpdate: boolean = false) {
    if (!onlyMapUpdate) {
      const routeId = veh?.routeId || veh?.nextRouteId || 0
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
    }
    // console.log("selectedBusStopRef: ", selectedBusStopRef)

    // Usuń starą warstwę przed dodaniem nowej
    removeRoute(false)

    

    // ROUTE
    map?.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: polylineRef.current?.map(([lat, lng]) => [lng, lat]) || []
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




    // BUS STOPS
    const total = routeStopsRef.current?.length || 0

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: routeStopsRef.current?.map((stop, index) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [stop.x, stop.y] },
        properties: {
          id:       stop.id,
          name:     stop.n,
          iconType: `stop-${resolveIconType(stop, index, total, selectedBusStopRef.current?.id)}`,
          // cały obiekt jako JSON – przyda się przy kliknięciu
          stopJson: JSON.stringify(stop),
        },
      })) || [],
    }

    map?.addSource(BUS_STOPS_SOURCE, { type: 'geojson', data: geojson })
    map?.addLayer({
      id:     BUS_STOPS_LAYER,
      type:   'symbol',
      source: BUS_STOPS_SOURCE,
      layout: {
        'icon-image':             ['get', 'iconType'],
        'icon-size':              1,
        'icon-allow-overlap':     true,
        'icon-ignore-placement':  true,
      },
    })
    map?.on('mouseenter', BUS_STOPS_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map?.on('mouseleave', BUS_STOPS_LAYER, () => {
      map.getCanvas().style.cursor = ''
    })

    map?.on('click', BUS_STOPS_LAYER, (e) => {
      e.preventDefault()
      const feature = e.features?.[0]
      if (!feature) return
      const stop: BusStopData = JSON.parse(feature.properties.stopJson)
      setSelectedBusStop(stop)
      setMenuState(3)

      posthog.capture("clicked_on_bus_stop", { name: stop.n, id: stop.id })
    })

    setRouteBusStops(routeStopsRef.current || [])
    setRoutePolyline(polylineRef.current || [])
  }

  function removeRoute(resetRef = true): void {
    if (map?.getLayer("route-line")) map.removeLayer("route-line")
    if (map?.getSource("route"))     map.removeSource("route")
    if (map?.getLayer(BUS_STOPS_LAYER))   map.removeLayer(BUS_STOPS_LAYER)
    if (map?.getSource(BUS_STOPS_SOURCE)) map.removeSource(BUS_STOPS_SOURCE)

    if (resetRef) {
      currentRouteIdRef.current = null
      routeStopsRef.current = null
    }
  }

  if (!user) {
    return <Navigate to="/logowanie" />
  }

  return (
    <div className="h-dvh bg-white dark:bg-neutral-900 text-black dark:text-white">
      {vehicles.length === 0 && <div className='w-full h-dvh z-1000 absolute flex justify-center items-center'>
        <LoadingScreen />
      </div>}

      <BottomSheet>
        <Menu currentRouteIdRef={currentRouteIdRef} routeStopsRef={routeStopsRef} />
      </BottomSheet>

      <div className='absolute top-4 left-4 z-10000 flex flex-row gap-1'>
        <ThemeToggle isDark={isDark} toggle={toggle} />
        <ChangeLang />
        <div className='bg-white h-9 w-9 dark:bg-zinc-900 backdrop-blur-md border border-zinc-200 dark:border-zinc-800
          rounded-full flex items-center justify-center gap-2 shadow-sm z-10 text-[13px] font-bold tracking-tight
          text-zinc-700 dark:text-zinc-200 min-w-9' ref={countdownRef}></div>
      </div>

      <div ref={mapContainer} className="w-full h-screen" />
{/*       
      <section className="w-full px-6 py-12 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Live Mapa Komunikacji Miejskiej – Rozkład Jazdy na Żywo
          </h1>
          
          <p className="text-base text-gray-600 leading-relaxed mb-8">
            Witaj w nowoczesnym systemie monitorowania pojazdów transportu publicznego. Nasza aplikacja umożliwia śledzenie pozycji autobusów oraz tramwajów w czasie rzeczywistym bezpośrednio na interaktywnej mapie. Dzięki integracji z systemami GPS pojazdów oraz otwartymi danymi miejskimi (GTFS-RT), pasażerowie mogą sprawdzić rzeczywisty czas przyjazdu środka transportu na konkretny przystanek.
          </p>
          
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Najważniejsze funkcje aplikacji:
          </h2>
          
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-8 pl-2">
            <li><strong className="text-gray-900">Lokalizacja pojazdów na żywo:</strong> Sprawdź, gdzie dokładnie na mapie znajduje się Twój autobus lub tramwaj.</li>
            <li><strong className="text-gray-900">Wirtualna tablica przystankowa:</strong> Kliknij w ikonę przystanku, aby zobaczyć najbliższe odjazdy i pełny rozkład jazdy.</li>
            <li><strong className="text-gray-900">Zapisywanie ulubionych:</strong> Zaloguj się bezpiecznie przez OAuth (Google/Facebook), aby zapisać swoje codzienne linie i mieć do nich szybki dostęp.</li>
            <li><strong className="text-gray-900">Inteligentna wyszukiwarka:</strong> Łatwo znajdź interesujący Cię przystanek, ulicę lub konkretny numer linii komunikacyjnej.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Najczęściej zadawane pytania (FAQ):
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Jak działa śledzenie autobusów na żywo?</h3>
              <p className="text-gray-600 leading-relaxed">
                Pojazdy komunikacji miejskiej wyposażone są w nadajniki GPS, które co kilkanaście sekund wysyłają swoją pozycję do centralnego systemu. Nasza aplikacja przetwarza te dane i nanosi aktualne pozycje pojazdów na mapę, dzięki czemu wiesz, czy Twój transport spóźni się z powodu korków.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Dlaczego warto zalogować się przez OAuth?</h3>
              <p className="text-gray-600 leading-relaxed">
                Logowanie za pomocą konta Google lub Facebook (protokół OAuth) pozwala w bezpieczny sposób przechowywać Twoje ustawienia w chmurze. Dzięki temu na każdym urządzeniu masz dostęp do swoich ulubionych przystanków i linii autobusowych bez konieczności ponownego ich szukania.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Co zrobić, gdy pojazd nie wyświetla się na mapie?</h3>
              <p className="text-gray-600 leading-relaxed">
                Czasami z przyczyn technicznych (np. awaria nadajnika GPS w starym modelu tramwaju lub brak zasięgu) pojazd może tymczasowo nie wysyłać swojej pozycji. W takim przypadku aplikacja wyświetla czas odjazdu na podstawie standardowego, teoretycznego rozkładu jazdy.
              </p>
            </div>
          </div>

        </div>
      </section>

      <footer className="w-full bg-gray-900 text-gray-400 py-6 text-center text-sm mt-auto pb-30">
        <p className="mb-2">&copy; 2026 Szymon Piera. Wszelkie prawa zastrzeżone.</p>
        <div className="space-x-4">
          <Link to="/spis-linii" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
            Spis Linii i Rozkłady
          </Link>
          <span className="text-gray-600">|</span>
          <Link to="/polityka-prywatnosci" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
            Polityka Prywatności
          </Link>
        </div>
      </footer> */}
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

function createStopIcon(type: StopIconType): Promise<HTMLImageElement> {
  const [top, bottom] = STOP_ICON_COLORS[type]
  // Unikalny gradId żeby nie kolizja w SVG spec
  const gradId = `g-${type}`
  const dpr = window.devicePixelRatio || 1
  const size = 18 * dpr


  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="1%"   stop-color="${top}"    />
          <stop offset="100%" stop-color="${bottom}" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="9" r="7"
        fill="url(#${gradId})"
        stroke="#666" stroke-width="2"
      />
    </svg>`

  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const img  = new Image(size, size)
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}

export function resolveIconType(stop: BusStopData, index: number, total: number, selectedId: number | undefined,): StopIconType {
  if (stop.id === selectedId) return 'selected'
  if (index === 0)            return 'first'
  if (index === total - 1)    return 'last'
  return 'default'
}

function cropLine(str: string | undefined): string {
  if (/^[a-zA-Z]+$/.test(str || "") && str?.length===1) return str
  return str ? str.replace(/[a-zA-Z]$/, "") : ""
}