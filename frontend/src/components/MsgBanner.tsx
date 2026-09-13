// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useRef, useMemo } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAppStore } from "../lib/store"
import { AlertTriangle } from '@boxicons/react'


export default function MsgBanner() {
  const { disparcherMsg, vehicles, shownLines } = useAppStore()

  const containerRef = useRef<HTMLDivElement>(null)

  const visibleLinesNum = useMemo(
    () => vehicles.filter(veh => shownLines.includes(veh.lineNum)).length,
    [vehicles, shownLines]
  )

  let title = ""
  let msg = ""

  if (disparcherMsg.length > 1) {
    title = "Powiadomienie!"
    msg = JSON.stringify(disparcherMsg)
  } else if (vehicles.length === 0) {
    title = "Uwaga!"
    msg = "Aktualnie występuje probem z łódzkimi serwerami. Spróbuj ponownie później."
  } else if (shownLines.length === 0) {
    title = "Uwaga!"
    msg = "Aktualnie nie wyświetlasz żadnej lini."
  } else if (visibleLinesNum === 0) {
    title = "Uwaga!"
    msg = "Aktualnie nie wyświetlasz żadnej lini lub żaden pojazd z włączonych nie kursuje."
  }

  // Animacja GSAP wejścia i wyjścia
  const cond = disparcherMsg.length > 1 || vehicles.length === 0 || shownLines.length === 0 || visibleLinesNum === 0
  useGSAP(
    () => {
      if (cond) {
        // WEJŚCIE: wysuwa się z góry
        gsap.to(containerRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'back.out(1.2)',
          display: 'flex'
        })
      } else {
        // WYJŚCIE: chowa się do góry
        gsap.to(containerRef.current, {
          y: -80,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            if (containerRef.current) {
              containerRef.current.style.display = 'none'
            }
          }
        })
      }
    },
    { dependencies: [disparcherMsg, vehicles.length, shownLines.length, visibleLinesNum] }
  )

  return (
    <div className="z-50 flex justify-center pointer-events-none">
      <div
        ref={containerRef}
        style={{ transform: 'translateY(-80px)', opacity: 0, display: 'none' }}
        className="w-full sm:max-w-sm bg-red-50/95 dark:bg-red-950/90 backdrop-blur-md border-2 border-red-200 dark:border-red-800 rounded-2xl py-3 px-4 shadow-xl flex items-center gap-3 pointer-events-auto transition-colors"
      >
        {/* Kontener ikony z nawiązaniem do alertu */}
        <div className="flex items-center justify-center p-2 bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 rounded-xl shrink-0">
          <AlertTriangle />
        </div>

        {/* Treść komunikatu */}
        <div className="flex flex-col grow min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-red-950 dark:text-red-100 truncate">
              {title}
            </span>
          </div>

          <p className="text-xs font-medium text-red-700/80 dark:text-red-300/80">
            {msg}
          </p>
        </div>
      </div>
    </div>
  )
}
