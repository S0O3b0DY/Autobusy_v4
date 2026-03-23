import { 
  X, 
  RefreshCw, 
  NavigationNorth, 
  ChevronRight, 
} from "@boxicons/react"
import { useAppStore } from "../lib/store"

export default function Vehicle() {
  const { selectedVehicle, setSelectedVehicle, setMenuState } = useAppStore()

  // Dane statyczne 
  const stops = [
    { id: 2, name: "Dąbrowskiego-Kossaka", time: "< 1min", status: "now" }, // 'now' = live
    { id: 3, name: "Tatrzańska-Rydla", time: "2 min", status: "upcoming" },
    { id: 4, name: "Tatrzańska-Broniewskiego", time: "3 min", status: "upcoming" },
    { id: 5, name: "Felińskiego-Konspiracyjnego WP", time: "4 min", status: "upcoming" },
    { id: 6, name: "Śląska-Konspiracyjnego WP", time: "5 min", status: "upcoming" },
    { id: 7, name: "Śląska-Szymańskiego NŻ", time: "6 min", status: "upcoming" },
  ]

  if (!selectedVehicle) return null

  return (
    <div className="flex flex-col h-full text-gray-900 dark:text-white font-sans w-full pb-4">
      <div className="px-3 pt-2 pb-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center px-2 py-0.5 min-w-9 h-7 rounded-md bg-black dark:bg-white text-white dark:text-black text-[15px] font-black shadow-sm">
            {selectedVehicle.lineNum ? selectedVehicle.lineNum : selectedVehicle.nextLineNum}
          </div>
          <ChevronRight className="text-gray-400 shrink-0" />
          <h2 className="text-[14px] font-bold max-w-70 tracking-tight uppercase">
            {selectedVehicle.dest ? selectedVehicle.dest : selectedVehicle.nextDest}
          </h2>
        </div>

        <div className="flex gap-1.5 items-center">
          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 active:scale-90 transition-all text-blue-500">
            <NavigationNorth />
          </button>
          
          <button className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 active:scale-90 transition-all">
            <RefreshCw className="text-gray-500" />
            <span className="text-[11px] font-mono font-bold text-gray-500 mt-0.5">7s</span>
          </button>
          
          <button 
            onClick={() => {setSelectedVehicle(null); setMenuState(0)}}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 active:scale-90 transition-all text-gray-500"
          >
            <X />
          </button>
        </div>
      </div>

      <div className="px-4 mb-1.5 text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        Następne odjazdy
      </div>

      {/* 2. TABELA - Floating Cards (Zamiast chamskich rzędów) */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        <div className="flex flex-col gap-1">
          {stops.map((stop) => {
            const isLive = stop.status === 'now'

            return (
              <div 
                key={stop.id}
                className={`
                  flex items-center px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-[0.98]
                  ${isLive 
                    ? 'bg-[#34C759]/10 border border-[#34C759]/20 shadow-sm' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}
                `}
              >
                {/* Index & Puls dla Live */}
                <div className="w-6 flex justify-start items-center relative">
                  {isLive ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34C759]"></span>
                    </span>
                  ) : (
                    <span className="text-[12px] font-medium text-gray-400">{stop.id}.</span>
                  )}
                </div>

                {/* Nazwa Przystanku */}
                <span className={`flex-1 text-[14px] truncate pr-2 ${
                  isLive ? 'font-bold text-[#34C759] dark:text-[#32D74B]' : 'font-medium'
                }`}>
                  {stop.name}
                </span>

                {/* Czas Odjazdu */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[14px] font-bold text-right min-w-[45px] ${
                    stop.time.includes('<') 
                      ? 'text-[#FF3B30]' 
                      : (isLive ? 'text-[#34C759] dark:text-[#32D74B]' : 'text-gray-900 dark:text-white')
                  }`}>
                    {stop.time}
                  </span>
                  <ChevronRight className={`${isLive ? 'text-[#34C759]/50' : 'text-gray-300 dark:text-gray-600'}`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}