// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useMemo, type RefObject } from "react"
import { useAuth } from "../contexts/AuthContext.tsx"
import { useTranslation } from "react-i18next"
import { useAppStore } from "../lib/store.ts"

// components
import { X, Search, PinAlt, ChevronRight, InfoCircle, Trash, Eraser } from "@boxicons/react"

// types
import type { BusStopData, LocalStorageBusStopsData } from "../types/"

// constants
// other
import { type GeoJSONSource } from "maplibre-gl"
import posthog from "posthog-js"




const BUS_STOPS_DATA: LocalStorageBusStopsData = JSON.parse(localStorage.getItem("stops") || "")
const busStops = BUS_STOPS_DATA.data

const busStopsMap = new Map(busStops.map(item => [item.id, item]))
export const BUS_STOPS_SEARCH_SOURCE = 'bus-stops-search'
export const BUS_STOPS_SEARCH_LAYER  = 'bus-stops-search-layer'

type Props = {
  routeStopsRef: RefObject<BusStopData[] | null>
}

export default function StopSearch({ routeStopsRef }: Props) {
  const { setSelectedBusStop, setMenuState, query, setQuery, map, favoriteStops, setFavoriteStops } = useAppStore()
  const { userLoggedIn } = useAuth()
  const { t } = useTranslation()

  // Algorytm wyszukiwania (min. 3 znaki)
  const filteredStops = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").trim()

    const q = normalize(query)
    if (q.length < 3) return []

    const tokens = q.split(" ")

    return busStops.map(stop => {
      const name = normalize(stop.n)
      const id = String(stop.id)

      let score = 0
        for (const token of tokens) {
          if (id === token) {
            score += 200
            continue
          }
          if (name.startsWith(token)) {
            score += 120
            continue
          }
          if (name.includes(" " + token)) {
            score += 80
            continue
          }
          if (name.includes(token)) {
            score += 50
            continue
          }
          if (fuzzyIncludes(name, token)) {
            score += 25
            continue
          }
          return null
        }

        score += Math.max(0, 40 - name.length / 2)
        score += tokens.length * 10

        return { stop, score }
    }).filter(Boolean).sort((a: any, b: any) => b.score - a.score).map((x: any) => x.stop).slice(0, 30)

    function fuzzyIncludes(text: string, token: string): boolean {
      let ti = 0
      for (let i = 0; i < text.length && ti < token.length; i++) {
        if (text[i] === token[ti]) ti++
      }
      return ti >= token.length - 1
    }
  }, [query])
  
  const handleSelect = (stop: BusStopData | undefined) => {
    if (!stop) return

    map?.easeTo({
      center: [stop.x, stop.y],
      offset: [0, -150],
      zoom: 15,
      duration: 600,
    })

    const geojson: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [stop.x, stop.y] },
          properties: {
            id:       stop.id,
            iconType: "stop-selected",
            stopJson: JSON.stringify(stop),
          }
        },
      ]
    }
    
    if (routeStopsRef.current?.find(st => st.id === stop.id)?.id !== stop.id) {
      // SOURCE
      const source = map?.getSource(BUS_STOPS_SEARCH_SOURCE) as GeoJSONSource | undefined
      if (source) {
        source.setData(geojson)
      } else {
        map?.addSource(BUS_STOPS_SEARCH_SOURCE, { type: 'geojson', data: geojson })

        if (!map?.getLayer(BUS_STOPS_SEARCH_LAYER)) {
          map?.addLayer({
            id:     BUS_STOPS_SEARCH_LAYER,
            type:   'symbol',
            source: BUS_STOPS_SEARCH_SOURCE,
            layout: {
              'icon-image':             ['get', 'iconType'],
              'icon-size':              1,
              'icon-allow-overlap':     true,
              'icon-ignore-placement':  true,
            },
          })
        }

        ;(map?.getSource(BUS_STOPS_SEARCH_SOURCE) as GeoJSONSource)?.setData(geojson)
      }


      // LAYER
      if (!map?.getLayer(BUS_STOPS_SEARCH_LAYER)) {
        console.log("dodano layer")
        map?.addLayer({
          id:     BUS_STOPS_SEARCH_LAYER,
          type:   'symbol',
          source: BUS_STOPS_SEARCH_SOURCE,
          layout: {
            'icon-image':             ['get', 'iconType'],
            'icon-size':              1,
            'icon-allow-overlap':     true,
            'icon-ignore-placement':  true,
          },
        })
      }

      map?.on('mouseenter', BUS_STOPS_SEARCH_LAYER, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map?.on('mouseleave', BUS_STOPS_SEARCH_LAYER, () => {
        map.getCanvas().style.cursor = ''
      })
  
      map?.on('click', BUS_STOPS_SEARCH_LAYER, (e) => {
        e.preventDefault()
        const feature = e.features?.[0]
        if (!feature) return
        const stop: BusStopData = JSON.parse(feature.properties.stopJson)
        setSelectedBusStop(stop)
        setMenuState(3)

        posthog.capture("clicked_on_bus_stop", { name: stop.n, id: stop.id })
      })
    }
      
    setSelectedBusStop(stop)
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

  return (
    <div className="flex flex-col h-full font-sans antialiased text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 mb-10 overflow-hidden shadow-xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
      
      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
        {/* LEWA STRONA - WYSZYKIWANIE */}
        <div className="flex-1 md:border-r border-zinc-200/50 dark:border-zinc-800/50">
          {/* SEARCH INPUT SECTION */}
          <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                <Search size="sm" />
              </div>
              <input
                type="text"
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-10 pr-10 text-[14px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                placeholder={t('stopSearch.placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-red-500 hover:text-red-400 dark:hover:text-red-400 cursor-pointer"
                >
                  <X size="xs" />
                </button>
              )}
            </div>
          </div>

          {/* RESULTS AREA */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">

            {query.length < 3 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center px-6">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-full mb-3">
                    <InfoCircle size="md" className="opacity-50" />
                </div>
                <p className="text-[13px] font-medium italic" dangerouslySetInnerHTML={{__html: t('stopSearch.hints.minChars')}}>
                </p>
              </div>
            ) : query.length >= 3 && filteredStops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center px-6">
                <p className="text-[13px] font-medium">
                  {t('stopSearch.hints.noResults', { query })}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredStops.map((stop) => (
                  <button
                    key={stop.id}
                    onClick={() => handleSelect(stop)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group text-left active:scale-[0.98] cursor-pointer hover:ring hover:ring-zinc-300 dark:hover:ring-zinc-800"
                  >
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-zinc-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                      <PinAlt size="sm" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-zinc-700 dark:text-zinc-200 truncate leading-tight">
                        {stop.n}
                      </h4>
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tight">
                        ID: {stop.id}
                      </p>
                    </div>

                    <ChevronRight
                      size="sm"
                      className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors"
                      onClick={() => setMenuState(3)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-[50%] bg-zinc-50/50 dark:bg-zinc-900/20 p-4 flex flex-col gap-4 border-t md:border-t-0 border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
          {/* HEADER */}
          <div className="flex flex-row items-center">
            <h3 className="flex-1 text-[15px] font-bold leading-none tracking-tight">
              Zapisane Przystanki
            </h3>
            {favoriteStops.length > 0 && <button
              onClick={() => setFavoriteStops([])}
              className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash size="sm"/>
            </button>}
          </div>

          {/* LIST */}
          {userLoggedIn ? <div>
            {favoriteStops.length > 0 ? favoriteStops.map((favStop, i) => (
              <button
                key={i}
                onClick={() => handleSelect(busStopsMap.get(favStop))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group text-left active:scale-[0.98] cursor-pointer hover:ring hover:ring-zinc-300 dark:hover:ring-zinc-800"
              >
                <div
                  className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg text-zinc-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors flex items-center justify-center flex-col cursor-pointer"
                  onClick={() => addToFavorites(busStopsMap.get(favStop))}
                  role="button"
                >
                  <Eraser size="sm" />
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tight group-hover:text-blue-500 transition-colors">USUŃ</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-zinc-700 dark:text-zinc-200 truncate leading-tight">
                    {busStopsMap.get(favStop)?.n}
                  </h4>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tight">
                    ID: {favStop}
                  </p>
                </div>

                <ChevronRight
                  size="sm"
                  className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors"
                  onClick={() => setMenuState(3)}
                />
              </button>
            )) : <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center px-6">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-full mb-3">
                    <InfoCircle size="md" className="opacity-50" />
                </div>
                <p className="text-[13px] font-medium italic">Brak zapisanych przystanków.</p>
              </div>}
          </div> : <p className="text-[13px] text-zinc-500 text-center dark:text-zinc-400">Tylko zalogowani użytkownicy mogą mieć dostęp do zapisanych przystanków.</p>}
          <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full block md:hidden"></div>
        </div>
      </div>
      
      

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          {t('stopSearch.footer.database', { count: busStops.length })}
        </span>
      </div>
    </div>
  )
}