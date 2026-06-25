// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useState, useEffect, useCallback, useRef, type RefObject } from "react"
import { useAuth } from "../contexts/AuthContext.tsx"
import { useAppStore } from "../lib/store"
import { useTranslation } from "react-i18next"

// components
import { X, RefreshCw, ChevronRight, Circle, Hashtag, Route, Sigma, List, Check, InfoCircle, ListUl, Star } from "@boxicons/react"

// types
import type { BusStopData, VehicleTimetable, LocalStorageBusStopsData } from './../types/index.d.ts'

// constants
import { BUS_STOPS_SOURCE, BUS_STOPS_LAYER } from "../pages/App"

// other
import clsx from "clsx"
import { app } from './../lib/firebase.ts'
import { getDatabase, ref, push, get } from "firebase/database"
import posthog from "posthog-js"
import { getUserJWTToken } from "../utils/index.ts"




type Props = {
  currentRouteIdRef: RefObject<number | null>
  routeStopsRef: RefObject<BusStopData[] | null>
}

const addTime = (hours = 0, minutes = 0, seconds = 0) => {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  date.setMinutes(date.getMinutes() + minutes)
  date.setSeconds(date.getSeconds() + seconds)
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
}

const BUS_STOPS_DATA: LocalStorageBusStopsData = JSON.parse(localStorage.getItem("stops") || "")
const busStops = BUS_STOPS_DATA.data

const busStopsMap = new Map(busStops.map(item => [item.id, item]))

export default function Vehicle({ currentRouteIdRef, routeStopsRef }: Props) {
  const db = getDatabase(app)
  const { selectedVehicle, setSelectedVehicle, setMenuState, map, setSelectedBusStop,
    setRouteBusStops, setRoutePolyline, favoriteStops, setFavoriteStops } = useAppStore()
  const { t } = useTranslation()
  const { userLoggedIn } = useAuth()

  const [timeLeft, setTimeLeft] = useState(30)
  //@ts-ignore
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stops, setStops] = useState<VehicleTimetable | null>(null)

  const selectedVehicleIdRef = useRef<number | null>(selectedVehicle?.vehId)
  const selectRef = useRef<HTMLSelectElement>(null)

  const [vehType, setVehType] = useState<{ number: string; type: string }[] | null>(null) 
  const [menuVehType, setMenuVehType] = useState<boolean>(false) 

  async function addBus(number: number, type: string) {
    await push(ref(db, `AUTOBUSY/${number}`), { number, type })
  }

  async function getBusType(number: number): Promise<{ number: string; type: string }[] | null> {
    const snapshot = await get(ref(db, `AUTOBUSY/${number}`))
    if (snapshot.exists()) {
      const entries = Object.values(snapshot.val()) as { number: string; type: string }[]
      return entries
    }
    return null
  }

  useEffect(() => {
    async function fetchType() {
      const type = await getBusType(selectedVehicle?.vehId || 0)
      setVehType(type) // ustawiasz już rozwiązaną wartość
    }
    fetchType()

    setTimeLeft(import.meta.env.VITE_REFRESH_MENU)
    fetchData()

    if (selectedVehicle?.vehId !== selectedVehicleIdRef.current) {
      selectedVehicleIdRef.current = selectedVehicle?.vehId
      setStops(null)
    }
  }, [selectedVehicle])

  const fetchData = useCallback(async () => {
    if (!selectedVehicle) return
    setIsRefreshing(true)

    try {
      const res = await fetch(`https://v2.szymon-pira.workers.dev/${await getUserJWTToken()}:vehicles/${selectedVehicle.vehId}/next_stops`) // import.meta.env.VITE_API_URL_VEHICLES + "/" + selectedVehicle?.vehId + "/next-stops"
      const data = await res.json()
      setStops(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedVehicle])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchData()
          return import.meta.env.VITE_REFRESH_MENU
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [fetchData])


  function handleManualReset(): void {
    setTimeLeft(import.meta.env.VITE_REFRESH_MENU)
    fetchData()
  }

  function handleSetSelectedBusStop(stopID: number): void {
    busStops.forEach(stop => {
      if (stop.id === stopID) {
        setSelectedBusStop(stop)
        map?.easeTo({
          center: [stop.x, stop.y],
          offset: [0, -150],
          zoom: 15,
          duration: 600,
        })
      }
    })
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

  if (!selectedVehicle) return null
  
  const bgColor = "bg-blue-500"

  const handleSubmit = () => {
    // console.log(selectRef.current?.value)
    if (!selectRef.current?.value) return
    addBus(selectedVehicle.vehId, selectRef.current?.value || "")
    setVehType(prev => prev ? [...prev, { number: String(selectedVehicle.vehId), type: selectRef.current?.value || "" }] : null)
    setMenuVehType(false)
  }

  function addToFavorites(stop: BusStopData | undefined) {
    if (!stop) return

    if (favoriteStops.includes(stop.id)) {
      setFavoriteStops(favoriteStops.filter(l => l !== stop.id))
      posthog.capture("removed_stop_from_fav", { name: stop.n, id: stop.id })
    } else {
      setFavoriteStops([...favoriteStops, stop.id])
      posthog.capture("added_stop_to_fav", { name: stop.n, id: stop.id })
    }
  }

  if (menuVehType) return (
      <div className="w-full absolute left-[50%] translate-x-[-50%] top-2 max-w-sm rounded-2xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header z informacją */}
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <InfoCircle size="xs" className="text-blue-500" />
                <h3 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100">{t('vehicle.setType.title')}</h3>
              </div>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t('vehicle.setType.description')}
              </p>
            </div>
            <button 
              onClick={() => {setMenuVehType(false)}}
              className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <X size="sm" />
            </button>
          </div>
        </div>

        {/* Formularz */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">
              {t('vehicle.setType.selectLabel')}
            </label>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                <ListUl size="sm" />
              </div>
              
              <select 
                ref={selectRef}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-[14px] font-medium
                  appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-zinc-700 dark:text-zinc-200"
                defaultValue=""
              >
                <option value="" disabled hidden>{t('vehicle.setType.selectPlaceholder')}</option>
                <option value="Krótki - Isuzu">{t('vehicle.setType.types.short_isuzu')}</option>
                <option value="Standardowy - Solaris (najnowszy)">{t('vehicle.setType.types.standard_solaris_new')}</option>
                <option value="Standardowy - Solaris">{t('vehicle.setType.types.standard_solaris')}</option>
                <option value="Standardowy - Mercedes">{t('vehicle.setType.types.standard_mercedes')}</option>
                <option value="Przegubowy - Solaris (najnowszy)">{t('vehicle.setType.types.articulated_solaris_new')}</option>
                <option value="Przegubowy - Solaris">{t('vehicle.setType.types.articulated_solaris')}</option>
                <option value="Przegubowy - Mercedes">{t('vehicle.setType.types.articulated_mercedes')}</option>
              </select>

              {/* Własna strzałka dla selecta */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Przycisk akcji */}
          <button
            onClick={handleSubmit}
            className={clsx("w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 \
              active:scale-[0.97] transition-all duration-150 hover:bg-blue-700 cursor-pointer",
              !selectRef.current?.value && "opacity-40 dark:opacity-15 bg-zinc-700"
            )}
          >
            <Check size="sm" />
            {t('vehicle.setType.apply')}
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <p className="text-[10px] text-center text-zinc-400 font-medium">
            {t('vehicle.setType.disclaimer')}
          </p>
        </div>

      </div>
  )

  return (
    <div className="flex flex-col h-full font-sans antialiased text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 overflow-hidden shadow-xl border border-zinc-200/60 dark:border-zinc-800/60">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`px-2 py-1 rounded-md ${bgColor} text-white text-[14px] font-black tracking-tighter shadow-sm`}>
            {selectedVehicle.lineNum}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-[13px] font-bold leading-none tracking-tight">
              {selectedVehicle.dest}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Refresh */}
          <div 
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer shadow-sm" 
            onClick={handleManualReset}
          >
            <span className="text-[12px] font-mono font-medium">{timeLeft}s</span>
            <RefreshCw size="sm" className={clsx("text-zinc-500", isRefreshing && "animate-spin")} />
          </div>
          
          {/* Close */}
          <button 
            onClick={() => {setSelectedVehicle(null); setMenuState(0); setRoutePolyline([]); setRouteBusStops([]); removeRoute()}}
            className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <X size="sm" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* LEWA STRONA: OŚ CZASU TRASY */}
        <div className="flex-1 flex flex-col min-w-0 md:border-r border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex-1 custom-scrollbar p-2 space-y-1 overflow-hidden">
            {!stops && <p className="text-center mt-2 text-sm text-zinc-500">{t('vehicle.loading')}</p>}

            {stops && stops.dep.map((stop) => {
              const isLive = stop.timeDepPredMode === 1
              
              let depText
              let textColor = "text-zinc-700 dark:text-zinc-400"

              if (isLive) {
                depText = t('vehicle.departure.lessThan1min')
                textColor = "text-red-500"
              } 
              else if (stop.timeDepPredMode === 2) {
                depText = `${stop.minToDep}min (${addTime(stop.hrsToDep, stop.minToDep, stop.secToDep)})`
                textColor = "text-blue-600 dark:text-blue-400"
              }
              else depText = addTime(stop.hrsToDep, stop.minToDep, stop.secToDep)

              return (
                <div
                  key={stop.busStopID}
                  className={clsx(
                    "group flex items-center gap-3 px-2 py-2 rounded-xl transition-colors cursor-pointer hover:ring hover:ring-zinc-400/50 dark:hover:ring-zinc-600/50",
                    isLive ? 'bg-blue-50/50 dark:bg-blue-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  )}
                  onClick={() => {handleSetSelectedBusStop(stop.busStopID)}}
                >
                  {/* Timeline Node */}
                  <div className="relative flex flex-col items-center shrink-0 w-6 group">
                    {isLive ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", bgColor)}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${bgColor}`}></span>
                      </span>
                    ) : (
                      <Circle size="sm" className="text-zinc-300 dark:text-zinc-600 fill-current group-hover:text-blue-500 transition-colors" />
                    )}
                    {isLive ? (
                      <div className="absolute top-2.5 w-0.5 h-7 bg-zinc-200 dark:bg-zinc-800" />
                    ) : (
                      <div className="absolute top-4.5 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />
                    )}
                  </div>

                  {/* Stop Name */}
                  <div className="flex-1 min-w-0">
                    <p className={clsx("text-[13px] truncate transition-colors", isLive ? 'font-bold tracking-tight text-blue-800 dark:text-blue-100' : 'font-medium text-zinc-700 dark:text-zinc-300')}>
                      {stop.busStopName}
                    </p>
                  </div>

                  {userLoggedIn && <button 
                    onClick={() => { addToFavorites(busStopsMap.get(stop.busStopID)) }}
                    className={clsx(
                      "transition-all active:scale-95 cursor-pointer rounded-sm",
                      favoriteStops.includes(stop.busStopID) 
                        ? "border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" 
                        : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-400"
                    )}
                  >
                    {favoriteStops.includes(stop.busStopID) ? <Star pack="filled" size="xs"/> : <Star size="xs"/>}
                  </button>}
                  
                  {/* Time */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[12px] font-bold ${textColor}`}>
                      {depText}
                    </span>
                    <ChevronRight size="sm" className="text-zinc-300 dark:text-zinc-700" onClick={() => setMenuState(3)} />
                  </div>
          
                </div>
              )
            })}
          </div>
        </div>

        {/* PRAWA STRONA: INFORMACJE */}
        <div className="w-full md:w-56 bg-zinc-50/50 dark:bg-zinc-900/20 p-4 flex flex-col gap-4 border-t md:border-t-0 border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
          <h3 className="text-[14px] font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            {t('vehicle.info.title')}
          </h3>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Hashtag size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('vehicle.info.sideNumber')}</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedVehicle.vehId}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Route size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('vehicle.info.route')}</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedVehicle.routeId || t('vehicle.info.noData')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sigma size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('vehicle.info.totalStops')}</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {stops?.dep ? stops.dep[stops.dep.length - 1].no : t('vehicle.loading')}
                </span>
              </div>
            </div>
            
            {/* <div className="flex items-start gap-3">
              <InfoSquare size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">informacje</span>
                <div className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 flex gap-1.5 mt-1">
                  {selectedVehicle.feat.split("").map((char) => {
                    if (char === "N") return <ArrowInDownSquareHalf size="xs" />
                    if (char === "K") return <Snowflake size="xs" />
                    if (char === "B") return <MobileBackAlt2 size="xs" />
                    if (char === "R") return <Cycling size="xs" />
                  })}
                </div>
              </div>
            </div> */}

            <div className="flex items-start gap-3 mb-10">
              <List size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-2">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('vehicle.info.vehicleType')}</span>                
                {vehType && <div className="flex flex-col gap-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {vehType?.map((item, i) => <span className="block" key={i}>{i+1}. {item.type}</span>)}
                </div>}
                <div>
                  <button
                    className="bg-blue-600 ring-2 ring-blue-200 rounded px-2 py-0.5 shadow active:scale-95 cursor-pointer text-xs font-bold text-zinc-300"
                    onClick={() => setMenuVehType(true)}
                  >
                    {vehType ? "Popraw" : t('vehicle.setType.buttonLabel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
