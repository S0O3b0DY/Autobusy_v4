// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useState, useEffect, useCallback, useRef, type RefObject } from "react"
import { useAppStore } from "../lib/store"
import { useTranslation } from "react-i18next"
import { useAuth } from "../contexts/AuthContext.tsx"

// components
import { X, RefreshCw, Hashtag, Globe, City, Bus, Tram, ChevronRight, Star } from "@boxicons/react"

// types
import type { BusStopTimetable, BusStopData } from './../types/index.d.ts'

// constants
import { BUS_STOPS_SEARCH_LAYER, BUS_STOPS_SEARCH_SOURCE } from "./StopSearch.tsx"

// other
import clsx from "clsx"
import posthog from "posthog-js"



type Props = {
  routeStopsRef: RefObject<BusStopData[] | null>
}

export default function BusStop({ routeStopsRef }: Props) {
  const { selectedBusStop, setSelectedBusStop, setMenuState, map, vehicles, setSelectedVehicle, shownLines,
    setShownLines, favoriteStops, setFavoriteStops } = useAppStore()
  const { t } = useTranslation()
  const { userLoggedIn } = useAuth()

  const [timeLeft, setTimeLeft] = useState(30)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [departures, setDepartures] = useState<BusStopTimetable | null>(null)

  const selectedBusStopIdRef = useRef<number | null>(selectedBusStop?.id)

  useEffect(() => {
    if (selectedBusStop?.id !== selectedBusStopIdRef.current) {
      selectedBusStopIdRef.current = selectedBusStop?.id
      setDepartures(null)
    }
  }, [selectedBusStop])

  const fetchData = useCallback(async () => {
    if (!selectedBusStop) return
    setIsRefreshing(true)

    try {
      const res = await fetch(import.meta.env.VITE_API_URL_BUS_STOP + selectedBusStop.id)
      const data = await res.json()
      setDepartures(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedBusStop])

  useEffect(() => {
    setTimeLeft(import.meta.env.VITE_REFRESH_MENU)
    fetchData()
  }, [selectedBusStop])

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

  function handleManualReset() {
    setTimeLeft(import.meta.env.VITE_REFRESH_MENU)
    fetchData()
  }

  function handleSetSelectedVehicle(routeID: number): void {
    vehicles.forEach((veh) => {
      if (veh.routeId === routeID || veh.nextRouteId === routeID) {
        if (!shownLines.includes(veh.lineNum ? veh.lineNum : veh.nextLineNum)) {
          setShownLines([ ...shownLines, veh.lineNum ? veh.lineNum : veh.nextLineNum ])
        }

        setSelectedVehicle(veh)
        map?.easeTo({
          center: [veh.lng, veh.lat],
          offset: [0, -150],
          zoom: 14,
          duration: 600,
        })
      }
    })
  }

  function addToFavorites(stop: BusStopData) {
    if (favoriteStops.includes(stop.id)) {
      setFavoriteStops(favoriteStops.filter(l => l !== stop.id))
      posthog.capture("removed_stop_from_fav", { name: stop.n, id: stop.id })
    } else {
      setFavoriteStops([...favoriteStops, stop.id])
      posthog.capture("added_stop_to_fav", { name: stop.n, id: stop.id })
    }
  }
  
  function removeFromMap(stop: BusStopData | null) {
    // console.log(stop,routeStopsRef.current?.find(st => st.id === stop?.id)?.id,stop?.id , routeStopsRef.current?.find(st => st.id === stop?.id)?.id !== stop?.id)
    if (routeStopsRef.current?.find(st => st.id === stop?.id)?.id !== stop?.id) {
      // console.log("I do pieca")
      if (map?.getLayer(BUS_STOPS_SEARCH_LAYER))   map.removeLayer(BUS_STOPS_SEARCH_LAYER)
        if (map?.getSource(BUS_STOPS_SEARCH_SOURCE)) map.removeSource(BUS_STOPS_SEARCH_SOURCE)
        }
  }
    
  if (!selectedBusStop) return null

  return (
    <div className="flex flex-col h-full font-sans antialiased text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 overflow-hidden shadow-xl border border-zinc-200/60 dark:border-zinc-800/60">
      
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50">
        <h2 className="text-[16px] font-bold leading-none tracking-tight">
          {selectedBusStop.n}
        </h2>

        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer shadow-sm" 
            onClick={handleManualReset}
          >
            <span className="text-[12px] font-mono font-medium">{timeLeft}s</span>
            <RefreshCw size="sm" className={clsx("text-zinc-500", isRefreshing && "animate-spin")} />
          </button>
          <button 
            onClick={() => { if(userLoggedIn) addToFavorites(selectedBusStop) }}
            title={!userLoggedIn ? "Tylko zalogowani użytkownicy mają dostęp do tej funkcji." : ""}
            className={clsx(
              "p-1.5 rounded-md border transition-all active:scale-95 shadow-sm cursor-pointer",
              favoriteStops.includes(selectedBusStop.id) 
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" 
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-400",
              !userLoggedIn && "opacity-30"
            )}
          >
            {favoriteStops.includes(selectedBusStop.id) ? <Star pack="filled" size="sm"/> : <Star size="sm"/>}
          </button>
          <button 
            onClick={() => { setSelectedBusStop(null); setMenuState(0); removeFromMap(selectedBusStop) }}
            className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <X size="sm" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA - GRID LAYOUT (Tabela + Informacje) */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* LEWA STRONA: TABELA ODJAZDÓW */}
        <div className="flex-1 flex flex-col min-w-0 md:border-r border-zinc-200/50 dark:border-zinc-800/50">
          
          {/* Nagłówki Tabeli */}
          <div className="grid grid-cols-[3.5rem_1fr_5rem] gap-2 px-3 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-100/50 dark:bg-zinc-900/30">
            <span>{t('busStop.table.line')}</span>
            <span>{t('busStop.table.direction')}</span>
            <span className="text-right">{t('busStop.table.departure')}</span>
          </div>

          {/* Lista Odjazdów */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
            {!departures && <p className="text-center mt-2 text-sm text-zinc-500">{t('busStop.loading')}</p>}
            
            {departures?.departs.map((dep) => {
              let isLive = dep.timeDepPredMode === 2 || dep.timeDepPredMode === 1

              return <div
                key={dep.routeID}
                className={clsx(
                  "grid grid-cols-[3.5rem_1fr_5rem] gap-2 px-2 py-2 items-center rounded-lg transition-colors cursor-pointer hover:ring hover:ring-white/50",
                  isLive
                    ? "bg-green-100/60 dark:bg-green-500/15" 
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                )}
                onClick={() => handleSetSelectedVehicle(dep.routeID)}
              >
                {/* Linia */}
                <div className="flex items-center gap-1 min-w-0">
                  {dep.vehType === "A" ? (
                    <Bus size="xs" className={clsx(isLive ? "text-green-600 dark:text-green-400" : "text-zinc-400")} />
                  ) : (
                    <Tram size="xs" className={clsx(isLive ? "text-green-600 dark:text-green-400" : "text-zinc-400")} />
                  )}
                  
                  <span className={clsx("text-[13px] font-black tracking-tight", isLive ? "text-green-700 dark:text-green-300" : "text-zinc-800 dark:text-zinc-200")}>
                    {dep.busLine}
                  </span>
                </div>

                {/* Kierunek */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={clsx("text-[12px] truncate", isLive ? "font-bold text-green-800 dark:text-green-100" : "font-medium text-zinc-600 dark:text-zinc-300")}>
                    {dep.dest}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                    {dep.routeID}
                  </span>
                </div>

                {/* Odjazd */}
                <div className={clsx("text-right text-[12px] font-bold flex justify-end gap-1", isLive ? "text-green-700 dark:text-green-400" : "text-zinc-800 dark:text-zinc-200")}>
                  {dep.timeDepPredMode === 1 && <span className="text-red-500">{t('busStop.departure.lessThan1min')}</span>}
                  {dep.timeDepPredMode === 2 && <span className="text-green-700 dark:text-green-400">{dep.departTimeFormated}</span>}
                  {dep.timeDepPredMode === 3 && <span className="text-zinc-800 dark:text-zinc-200">{dep.departTimeFormated}</span>}
                  <ChevronRight
                    size="sm"
                    className={clsx( isLive ? (dep.timeDepPredMode === 1 ? "text-red-500" : "text-green-700 dark:text-green-300") : "text-zinc-800 dark:text-zinc-200")}
                    onClick={() => setMenuState(4)}
                  />
                </div>
              </div>
            })}
          </div>
        </div>

        {/* PRAWA STRONA (lub dół na mobilce): INFORMACJE */}
        <div className="w-full md:w-56 bg-zinc-50/50 dark:bg-zinc-900/20 p-4 flex flex-col gap-4 border-t pb-10 md:border-t-0 border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
          <h3 className="text-[14px] font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            {t('busStop.info.title')}
          </h3>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Hashtag size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('busStop.info.stopId')}</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{selectedBusStop?.id}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <City size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('busStop.info.zone')}</span>
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{selectedBusStop?.z}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe size="sm" className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('busStop.info.coords')}</span>
                <div className="flex flex-row gap-3 text-[12px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
                  <span>{selectedBusStop?.x.toFixed(5)}</span>
                  <span>{selectedBusStop?.y.toFixed(5)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
