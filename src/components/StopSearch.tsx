import { useMemo, useRef } from "react"
import { X, Search, PinAlt, ChevronRight, InfoCircle } from "@boxicons/react"
// @ts-ignore
import { Map as MapLibreMap, Marker} from "maplibre-gl"
import { useAppStore } from "../lib/store.ts"
import busStops from '../lib/stops.ts'
import type { BusStopData } from "../types/index"

export default function StopSearch({ BSMarkersRef }: any) {
  const { setSelectedBusStop, setMenuState, query, setQuery, map } = useAppStore()

  const shownBSMarker = useRef<Marker | null>(null)
  const shownBSData = useRef<BusStopData | null>(null)
  const selectedBusStopRef = useRef<BusStopData | null>(null)

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


  const handleSelect = (stop: BusStopData) => {
    map?.easeTo({
      center: [stop.x, stop.y],
      offset: [0, -150],
      zoom: 15,
      duration: 600,
    })
    
    if (shownBSData.current?.id !== stop.id) {
      shownBSData.current = stop
      selectedBusStopRef.current = stop
      setSelectedBusStop(stop)

      shownBSMarker.current?.remove()
      shownBSMarker.current = null

      let gradient = "linear-gradient(180deg,rgba(255, 234, 0, 1) 1%, rgba(224, 191, 0, 1) 100%)"
      if (stop.id === selectedBusStopRef.current?.id) gradient = "linear-gradient(180deg,rgba(54, 215, 255, 1) 1%, rgba(27, 187, 227, 1) 100%)"

      const el = document.createElement('div')
      el.style.cssText = `width:17px; height:17px; border-radius:100%; background:${gradient}; cursor:pointer; font-size:0rem; border:2px solid #666; zIndex:1;`
      el.textContent = '.'

      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat([stop.x, stop.y])
        .addTo(map!)
      shownBSMarker.current = marker
      BSMarkersRef.current.set(stop.id, marker)

      el.addEventListener("click", (e) => {
        e.stopPropagation()
        setMenuState(3)
      })
    }
  }


  return (
    <div className="flex flex-col h-full font-sans antialiased text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 mb-10 overflow-hidden shadow-xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
      
      {/* SEARCH INPUT SECTION */}
      <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
            <Search size="sm" />
          </div>
          <input
            type="text"
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-10 pr-10 text-[14px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            placeholder="Szukaj przystanku (np. Śląska)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-red-500 hover:text-red-400 dark:hover:text-red-400"
            >
              <X size="xs" />
            </button>
          )}
        </div>
      </div>

      {/* RESULTS AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {query.length > 0 && query.length < 3 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center px-6">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-full mb-3">
                <InfoCircle size="md" className="opacity-50" />
            </div>
            <p className="text-[13px] font-medium italic">
              Wpisz co najmniej <span className="text-zinc-600 dark:text-zinc-200 font-bold">3 znaki</span>, aby rozpocząć wyszukiwanie.
            </p>
          </div>
        ) : query.length >= 3 && filteredStops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center px-6">
            <p className="text-[13px] font-medium">
              Nie znaleziono przystanku o nazwie <span className="text-zinc-600 dark:text-zinc-200 font-bold">"{query}"</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredStops.map((stop) => (
              <button
                key={stop.id}
                onClick={() => handleSelect(stop)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group text-left active:scale-[0.98]"
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

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
           Baza przystanków: {busStops.length}
        </span>
      </div>
    </div>
  )
}