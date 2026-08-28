// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useEffect, useRef, useState } from 'react'
import { useAuth } from "../contexts/AuthContext"
import { Link, useLocation } from 'react-router-dom'

// components
import { X, Window, Bus } from "@boxicons/react"

// types
// constants
// other
import gsap from 'gsap'

const DISMISS_KEY = "app-cta-dismissed-at"
const DISMISS_HOURS = 24 // po ilu godzinach okienko wróci

export default function AppCTA() {
  const { userLoggedIn } = useAuth()
  const location = useLocation()

  const [visible, setVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Nie pokazuj wewnątrz samej aplikacji (/app) ani logowania
  const isAppRoute = location.pathname.startsWith("/app")

  useEffect(() => {
    if (isAppRoute) return

    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const hoursPassed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60)
      if (hoursPassed < DISMISS_HOURS) return
    }

    // Delikatne opóźnienie — nie wyskakuje natychmiast po wejściu na stronę
    const timeout = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(timeout)
  }, [isAppRoute])

  useEffect(() => {
    if (!visible || !cardRef.current) return

    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
    )
  }, [visible])

  function handleClose() {
    if (!cardRef.current) {
      setVisible(false)
      return
    }

    gsap.to(cardRef.current, {
      y: 24,
      opacity: 0,
      scale: 0.96,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => setVisible(false)
    })

    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  if (isAppRoute || !visible) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-1500 sm:max-w-sm">
      <div
        ref={cardRef}
        className="relative bg-white dark:bg-zinc-900 border-2 border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-5 pr-11 overflow-hidden"
      >
        {/* Delikatny dekoracyjny akcent w tle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primaty-900/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-neutral-400 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Zamknij"
        >
          <X size="sm" />
        </button>

        <div className="flex items-start gap-3 mb-4 relative">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primaty-900/10 dark:bg-blue-500/15 text-primaty-900 dark:text-blue-400 shrink-0">
            <Bus size="sm" />
          </div>
          <div>
            <h3 className="text-[15px] font-black text-neutral-900 dark:text-white leading-tight">
              {userLoggedIn ? "Wracaj do aplikacji" : "Przejdź do aplikacji"}
            </h3>
            <p className="text-[13px] font-medium text-neutral-600 dark:text-zinc-400 mt-1 leading-snug">
              {userLoggedIn
                ? "Twoje zapisane linie i przystanki czekają w aplikacji."
                : "Zobacz odjazdy na żywo i zaplanuj trasę w kilka sekund."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link to={userLoggedIn ? "/app" : "/logowanie"} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 bg-black dark:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-lg hover:-translate-y-0.5 hover:bg-black/90 dark:hover:bg-blue-400 transition-all cursor-pointer shadow-md">
              <Window size="sm" />
              {userLoggedIn ? "Przejdź do aplikacji" : "Zaloguj się"}
            </button>
          </Link>
          <button
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-bold text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Zostań tu
          </button>
        </div>
      </div>
    </div>
  )
}