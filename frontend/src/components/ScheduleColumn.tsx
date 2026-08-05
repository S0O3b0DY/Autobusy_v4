// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

interface ScheduleColumnProps {
  title: string
  times: string[]
}

function groupTimesByHour(times: string[] = []): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}

  times.forEach((time) => {
    const [hour, minute] = time.split(':')
    const formattedHour = hour.padStart(2, '0')
    
    if (!grouped[formattedHour]) {
      grouped[formattedHour] = []
    }
    grouped[formattedHour].push(minute)
  })

  return grouped
}

export default function ScheduleColumn({ title, times }: ScheduleColumnProps) {
  const groupedTimes = groupTimesByHour(times)
  const hours = Object.keys(groupedTimes).sort((a, b) => Number(a) - Number(b))

  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden flex flex-col">
      {/* Nagłówek kolumny */}
      <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200/60 dark:border-zinc-800/60 text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {title}
        </span>
      </div>

      {/* Lista Wierszy */}
      <div className="p-2 space-y-1 divide-y divide-zinc-200/40 dark:divide-zinc-800/40 text-xs flex-1">
        {hours.length === 0 ? (
          <p className="text-center text-zinc-400 py-4 text-[11px]">Brak kursów</p>
        ) : (
          hours.map((hour) => (
            <div key={hour} className="flex items-start pt-1 first:pt-0">
              {/* Godzina (np. 05) */}
              <span className="w-8 font-black text-zinc-900 dark:text-zinc-100 shrink-0 text-right pr-2">
                {hour}
              </span>

              {/* Minuty (np. 07 37 44) */}
              <div className="flex flex-wrap gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
                {groupedTimes[hour].map((minute, idx) => (
                  <span 
                    key={idx} 
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    {minute}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}