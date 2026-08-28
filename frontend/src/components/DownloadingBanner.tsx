// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAppStore } from "../lib/store"
import { ArrowToBottom } from '@boxicons/react'

export default function DownloadingBanner() {
  const { downloading } = useAppStore()

  const containerRef = useRef<HTMLDivElement>(null)

  // Animacja GSAP wejścia i wyjścia
  useGSAP(
    () => {
      if (downloading) {
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
    { dependencies: [downloading] }
  )

  return (
    <div className="fixed top-15 md:top-4 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none">
      <div
        ref={containerRef}
        style={{ transform: 'translateY(-80px)', opacity: 0, display: 'none' }}
        className="w-full sm:max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-2 border-neutral-200 dark:border-zinc-800 rounded-2xl py-3 px-4 shadow-xl items-center gap-3 pointer-events-auto transition-colors"
      >
        {/* Kontener ikony z obracającym się spinnerem Boxicons */}
        <div className="flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <ArrowToBottom />
        </div>

        {/* Treść komunikatu */}
        <div className="flex flex-col grow min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100 truncate">
              Pobieranie danych
            </span>
          </div>

          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
            Proszę czekać...
          </p>
        </div>
      </div>
    </div>
  )
}