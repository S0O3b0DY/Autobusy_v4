import { X, RefreshCw, NavigationNorth, ChevronRight, Circle, Hashtag, Route, Sigma } from "@boxicons/react"
import { useAppStore } from "../lib/store"
import clsx from "clsx"
import { useState, useEffect, useCallback } from "react"
import type { VehicleTimetable } from './../types/index.d.ts'
import busStops from './../lib/stops.ts'

const addTime = (hours = 0, minutes = 0, seconds = 0) => {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  date.setMinutes(date.getMinutes() + minutes)
  date.setSeconds(date.getSeconds() + seconds)
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
}

interface Coords {
  lat: number
  lng: number
}

const getBearing = (prev: Coords, current: Coords): number => {
  // Konwersja na radiany
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI

  const lat1 = toRad(prev.lat)
  const lat2 = toRad(current.lat)
  const dLng = toRad(current.lng - prev.lng)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  let bearing = toDeg(Math.atan2(y, x))

  // Normalizacja do zakresu 0-360°
  return (bearing + 360) % 360
}

export default function Vehicle() {
  const { selectedVehicle, setSelectedVehicle, setMenuState, map, setSelectedBusStop, setRouteBusStops, setRoutePolyline } = useAppStore()

  const [timeLeft, setTimeLeft] = useState(30)
  //@ts-ignore
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stops, setStops] = useState<VehicleTimetable | null>(null)
  const [follow, setFollow] = useState<boolean>(false)

  const fetchData = useCallback(async () => {
    if (!selectedVehicle) return
    setIsRefreshing(true)

    try {
      const res = await fetch(`https://v2.szymon-pira.workers.dev/vehicles/${selectedVehicle?.sideNum}/next-stops`)
      const data = await res.json()
      setStops(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedVehicle])

  useEffect(() => {
    setTimeLeft(30)
    fetchData()
  }, [selectedVehicle])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchData()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [fetchData])

  useEffect(() => {
    if (!follow) return
    
    map?.easeTo({
      center: [selectedVehicle?.lng || 0, selectedVehicle?.lat || 0],
      offset: [0, -150],
      bearing: getBearing({lat: selectedVehicle?.prevLat || 0, lng: selectedVehicle?.prevLng || 0}, {lat: selectedVehicle?.lat || 0, lng: selectedVehicle?.lng || 0}),           // rotacja w stopniach (0 = północ)
      pitch: 80,
      zoom: 16,
      duration: 1000,
    })
    
  }, [follow, selectedVehicle])


  function handleManualReset(): void {
    setTimeLeft(30)
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


  if (!selectedVehicle) return null
  
  const bgColor = "bg-blue-500"

  return (
    <div className="flex flex-col h-full font-sans antialiased text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 mb-10 overflow-hidden shadow-xl border border-zinc-200/60 dark:border-zinc-800/60">
      
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`px-2 py-1 rounded-md ${bgColor} text-white text-[14px] font-black tracking-tighter shadow-sm`}>
            {selectedVehicle.lineNum || selectedVehicle.nextLineNum}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-[13px] font-bold leading-none tracking-tight">
              {selectedVehicle.dest || selectedVehicle.nextDest}
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
          
          {/* Follow toggle */}
          <button 
            className={clsx(
              "p-1.5 rounded-md border transition-all active:scale-95 shadow-sm",
              follow 
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" 
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
            )}
            onClick={() => setFollow(prev => !prev)}
          >
            <NavigationNorth size="sm" />
          </button>
          
          {/* Close */}
          <button 
            onClick={() => {setSelectedVehicle(null); setMenuState(0); setRoutePolyline([]); setRouteBusStops([])}}
            className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 active:scale-95 transition-all shadow-sm"
          >
            <X size="sm" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* LEWA STRONA: OŚ CZASU TRASY */}
        <div className="flex-1 flex flex-col min-w-0 md:border-r border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {stops && stops.dep.map((stop, idx) => {
              const isLive = stop.timeDepPredMode === 1
              
              let depText
              let textColor = "text-zinc-700 dark:text-zinc-400"

              if (isLive) {
                depText = "<1min"
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
                    "group flex items-center gap-3 px-2 py-2 rounded-xl transition-all cursor-pointer",
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
                    {idx !== stops.dep.length - 1 && (
                      <div className="absolute top-5 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />
                    )}
                  </div>

                  {/* Stop Name */}
                  <div className="flex-1 min-w-0">
                    <p className={clsx("text-[13px] truncate transition-colors", isLive ? 'font-bold tracking-tight text-blue-800 dark:text-blue-100' : 'font-medium text-zinc-700 dark:text-zinc-300')}>
                      {stop.busStopName}
                    </p>
                  </div>

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
            Informacje:
          </h3>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Hashtag size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Numer boczny</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedVehicle.sideNum}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Route size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Trasa</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedVehicle.routeId || selectedVehicle.nextRouteId || "Brak danych"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sigma size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Łącznie przystanków</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {stops?.dep ? stops.dep[stops.dep.length - 1].no : "Ładowanie..."}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}