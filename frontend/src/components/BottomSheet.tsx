// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useRef, useEffect, useCallback } from "react"
import { useWindowSize } from "../hooks/useWindowSize"
import { useAppStore } from "../lib/store"
import { useAuth } from '../contexts/AuthContext.tsx'
import { useTranslation } from 'react-i18next'

import { SliderAlt, Search, GitCommit, Bus, UserCircle } from "@boxicons/react"
import clsx from "clsx"

const nearest = (snaps: number[], h: number) =>
  snaps.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a))
const clamp = (snaps: number[], h: number) =>
  Math.min(Math.max(h, snaps[0]), snaps[2])

// Ile px musi przesunąć palec, żeby zdecydować czy to drag czy scroll
const DECISION_THRESHOLD = 6

interface Props {
  children: React.ReactNode
  title?: string
}

export default function BottomSheet({ children }: Props) {
  const { _width, _height } = useWindowSize()
  const { userLoggedIn, user } = useAuth()
  const { t } = useTranslation()

  const snapsRef = useRef<number[]>([75, Math.round(_height / 2), _height - 50])

  useEffect(() => {
    snapsRef.current = [75, Math.round(_height / 2), _height - 60]
  }, [_width, _height])

  const { menuState, setMenuState, selectedVehicle, selectedBusStop } = useAppStore()

  const sheetRef   = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const heightRef  = useRef(snapsRef.current[0])

  // --- Stan dragu ---
  const dragging    = useRef(false)
  const startY      = useRef(0)
  const startH      = useRef(0)
  const velocityRef = useRef(0)
  const lastY       = useRef(0)
  const lastT       = useRef(0)
  const rafRef      = useRef<number | null>(null)

  // --- Stan gestu dotykowego ---
  // 'idle'      : gest nie zainicjowany
  // 'undecided' : dotknięto, ale kierunek nieznany (czekamy na DECISION_THRESHOLD)
  // 'dragging'  : przesuwamy cały sheet
  // 'scrolling' : scrollujemy treść (nie ruszamy sheetu)
  const touchMode   = useRef<'idle' | 'undecided' | 'dragging' | 'scrolling'>('idle')
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)

  // Czy sheet jest w pełni rozwinięty?
  const isAtMax = useCallback(() => {
    const snaps = snapsRef.current
    return heightRef.current >= snaps[snaps.length - 1] - 4
  }, [])

  const setHeight = useCallback((h: number, animated: boolean) => {
    if (!sheetRef.current || !contentRef.current) return
    const snaps = snapsRef.current
    heightRef.current = h
    sheetRef.current.style.transition = animated ? "height 0.35s cubic-bezier(0.32,0.72,0,1)" : "none"
    sheetRef.current.style.height = `${h}px`
    const collapsed = h === snaps[0]
    contentRef.current.style.opacity = collapsed ? "0" : "1"
    contentRef.current.style.pointerEvents = collapsed ? "none" : "auto"
  }, [])

  useEffect(() => { setHeight(snapsRef.current[0], false) }, [])

  useEffect(() => {
    const snaps = snapsRef.current
    const clamped = clamp(snaps, heightRef.current)
    const target = nearest(snaps, clamped)
    setHeight(target, true)
  }, [_width, _height, setHeight])

  // Inicjuje drag sheetu od danego clientY
  const onDown = useCallback((clientY: number) => {
    dragging.current = true
    startY.current = clientY
    startH.current = heightRef.current
    velocityRef.current = 0
    lastY.current = clientY
    lastT.current = performance.now()
    if (sheetRef.current) sheetRef.current.style.transition = "none"
  }, [])

  const onMove = useCallback((clientY: number) => {
    if (!dragging.current) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const snaps = snapsRef.current
      const now = performance.now()
      const dt = now - lastT.current
      if (dt > 0) velocityRef.current = (lastY.current - clientY) / dt
      lastY.current = clientY
      lastT.current = now

      const next = clamp(snaps, startH.current + startY.current - clientY)
      if (sheetRef.current) sheetRef.current.style.height = `${next}px`

      if (contentRef.current) {
        const ratio = Math.max(0, (next - snaps[0]) / (snaps[1] - snaps[0]))
        contentRef.current.style.opacity = String(Math.min(ratio * 2, 1))
      }
    })
  }, [])

  const onUp = useCallback((clientY: number) => {
    if (!dragging.current) return
    dragging.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const snaps = snapsRef.current
    const current = clamp(snaps, startH.current + startY.current - clientY)
    const v = velocityRef.current

    let target: number
    if (v > 1.2) {
      const idx = snaps.findIndex(s => s >= current)
      target = snaps[Math.min(idx + (idx === 0 ? 1 : 0), snaps.length - 1)] ?? snaps[snaps.length - 1]
    } else if (v < -1.2) {
      const idx = [...snaps].reverse().findIndex(s => s <= current)
      const realIdx = snaps.length - 1 - idx
      target = snaps[Math.max(realIdx - (realIdx === snaps.length - 1 ? 1 : 0), 0)] ?? snaps[0]
    } else {
      target = nearest(snaps, current)
    }

    setHeight(target, true)

    if (startH.current === snaps[0] && target > snaps[0] && menuState === 0) {
      setMenuState(1)
    }
  }, [setHeight, menuState])

  // ─── Mysz (desktop) ─────────────────────────────────────────────────────────
  useEffect(() => {
    const move = (e: MouseEvent) => onMove(e.clientY)
    const up   = (e: MouseEvent) => onUp(e.clientY)
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
  }, [onMove, onUp])

  // ─── Dotyk (mobile) — logika Google Maps ────────────────────────────────────
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const onTouchStart = (e: TouchEvent) => {
      const touch  = e.touches[0]
      const target = e.target as HTMLElement

      touchStartY.current = touch.clientY
      touchStartX.current = touch.clientX

      const atMax      = isAtMax()
      const inContent  = !!contentRef.current?.contains(target)
      const interactive = !!(
        target.closest('button') ||
        target.closest('input') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      )

      if (interactive) {
        // Przycisk: czekamy — jeśli palec ruszy > progu, zmienimy w drag
        touchMode.current = 'undecided'
        return
      }

      if (inContent && atMax) {
        // Treść przy pełnym rozwinięciu: czekamy na kierunek
        touchMode.current = 'undecided'
        return
      }

      // Reszta (uchwyt, pasek nav, treść przy niepełnym rozwinięciu): drag od razu
      touchMode.current = 'dragging'
      onDown(touch.clientY)
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch  = e.touches[0]
      const deltaY = touch.clientY - touchStartY.current // + = palec w dół
      const deltaX = touch.clientX - touchStartX.current
      const absY   = Math.abs(deltaY)
      const absX   = Math.abs(deltaX)

      // ── Tryb undecided: szukamy intencji ──────────────────────────────────
      if (touchMode.current === 'undecided') {
        if (Math.max(absY, absX) < DECISION_THRESHOLD) return // za mało ruchu

        // Wyraźnie poziomy gest (mapa, slider) → nie ruszamy sheetu
        if (absX > absY * 1.5) {
          touchMode.current = 'scrolling'
          return
        }

        const atMax     = isAtMax()
        const scrollTop = contentRef.current?.scrollTop ?? 0

        if (!atMax) {
          // Sheet nie jest w pełni rozwinięty → pionowy gest zawsze = drag sheetu
          // (nawet jeśli startowaliśmy na przycisku)
          touchMode.current = 'dragging'
          onDown(touchStartY.current) // start od oryginalnego punktu dotyku
          e.preventDefault()
          onMove(touch.clientY)       // zastosuj skumulowany ruch
          return
        }

        // Sheet w pełni rozwinięty
        if (deltaY > 0 && scrollTop === 0) {
          // Ciągnięcie w dół od początku treści → zwijamy sheet
          touchMode.current = 'dragging'
          onDown(touchStartY.current)
          e.preventDefault()
          onMove(touch.clientY)
        } else {
          // Scrollujemy treść — nie blokujemy
          touchMode.current = 'scrolling'
        }
        return
      }

      // ── Tryb dragging: przesuwamy sheet ───────────────────────────────────
      if (touchMode.current === 'dragging') {
        // preventDefault blokuje natywny scroll ORAZ zapobiega fire'owaniu
        // click-a na przycisku po skończeniu swipe'a
        e.preventDefault()
        onMove(touch.clientY)
        return
      }

      // 'scrolling' | 'idle' → nie ruszamy, pozwalamy przeglądarce scrollować
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (touchMode.current === 'dragging') {
        onUp(e.changedTouches[0].clientY)
      }
      touchMode.current = 'idle'
    }

    const onTouchCancel = () => {
      touchMode.current = 'idle'
      dragging.current  = false
    }

    // touchstart passive: true — nie blokujemy domyślnych akcji na starcie
    // touchmove passive: false — chcemy móc wywołać preventDefault()
    sheet.addEventListener('touchstart',  onTouchStart,  { passive: true })
    sheet.addEventListener('touchmove',   onTouchMove,   { passive: false })
    sheet.addEventListener('touchend',    onTouchEnd,    { passive: true })
    sheet.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      sheet.removeEventListener('touchstart',  onTouchStart)
      sheet.removeEventListener('touchmove',   onTouchMove)
      sheet.removeEventListener('touchend',    onTouchEnd)
      sheet.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [isAtMax, onDown, onMove, onUp])

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
    const snaps = snapsRef.current
    if (menuState !== 0) setHeight(snaps[1], true)
    if (menuState === 0) setHeight(snaps[0], true)
  }, [menuState])

  useEffect(() => { if (selectedBusStop !== null && menuState === 3) setMenuState(3) }, [selectedBusStop])
  useEffect(() => { if (selectedVehicle !== null && menuState === 4) setMenuState(4) }, [selectedVehicle])

  return (
    <div
      ref={sheetRef}
      // Mysz: identyczna logika co dotyk — przyciski i scrollowana treść ignorowane
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('input') || target.closest('a')) return
        if (contentRef.current?.contains(target) && contentRef.current.scrollTop > 0) return
        onDown(e.clientY)
      }}
      style={{
        height: snapsRef.current[0],
        willChange: "height",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        backdropFilter: "blur(24px) saturate(180%)",
        // ✅ touchAction NIE jest ustawiony na root — obsługujemy to strefami poniżej
      }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0
        w-full max-w-2xl z-50 bg-white/95 dark:bg-neutral-900/90 border border-black/10
        dark:border-white/10 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
    >

      {/* ══ UCHWYT — touchAction:none gwarantuje drag zawsze ══════════════════ */}
      <div
        className="shrink-0 flex flex-col items-center gap-2 pt-3 pb-2 select-none"
        style={{ touchAction: "none" }}
      >
        <div className="w-50 h-1 rounded-full bg-black/20 dark:bg-white/25 pointer-events-none" />
      </div>

      <div className="h-px bg-black/6 dark:bg-white/8 shrink-0" />

      {/* ══ TREŚĆ — natywny scroll gdy sheet rozwinięty ════════════════════════
          Brak touchAction tutaj = przeglądarka może scrollować pionowo.
          Nasz handler onTouchMove blokuje scroll (preventDefault) tylko gdy
          wykryje 'dragging', w przeciwnym razie zostawia scroll przeglądarce. */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto overscroll-contain pb-8"
        style={{ opacity: 0, pointerEvents: "none", transition: "opacity 0.2s ease" }}
      >
        {children}
      </div>

      {/* ══ PASEK NAWIGACYJNY — touchAction:none: ═══════════════════════════════
          - przyciski reagują na tap (click fire'uje normalnie)
          - swipe na przycisku lub tle paska → tryb undecided → po progu = drag */}
      <div
        className="absolute bottom-0 flex w-full px-10 justify-center gap-4 h-10 items-center bg-white/90
          py-6 rounded-t-2xl backdrop-blur-3xl dark:bg-neutral-900/70 border-t border-t-zinc-300 dark:border-t-zinc-800"
        style={{ touchAction: "none" }}
      >
        <button
          className="flex flex-col items-center justify-center transition-active active:scale-90 z-100 transition-all hover:bg-blue-50 dark:hover:bg-blue-600/15 px-2.5 rounded-md cursor-pointer"
          onClick={() => setMenuState(menuState === 1 ? 0 : 1)}
        >
          <SliderAlt className={clsx("text-[24px]", menuState === 1 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
          <span className={clsx("text-[10px] mt-1 font-medium", menuState === 1 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
            {t('nav.filter')}
          </span>
        </button>

        <button
          className="flex flex-col items-center justify-center transition-active active:scale-90 z-100 hover:bg-blue-50 dark:hover:bg-blue-600/15 px-2.5 rounded-md cursor-pointer"
          onClick={() => setMenuState(menuState === 2 ? 0 : 2)}
        >
          <Search className={clsx("text-[24px]", menuState === 2 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
          <span className={clsx("text-[10px] mt-1 font-medium", menuState === 2 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
            {t('nav.search')}
          </span>
        </button>

        {selectedBusStop && (
          <button
            className="flex flex-col items-center justify-center transition-active active:scale-90 z-100 hover:bg-blue-50 dark:hover:bg-blue-600/15 px-2.5 rounded-md cursor-pointer"
            onClick={() => setMenuState(menuState === 3 ? 0 : 3)}
          >
            <GitCommit className={clsx("text-[24px]", menuState === 3 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
            <span className={clsx("text-[10px] mt-1 font-medium", menuState === 3 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
              {t('nav.stop')}
            </span>
          </button>
        )}

        {selectedVehicle && (
          <button
            className="flex flex-col items-center justify-center transition-active active:scale-90 z-100 hover:bg-blue-50 dark:hover:bg-blue-600/15 px-2.5 rounded-md cursor-pointer"
            onClick={() => setMenuState(menuState === 4 ? 0 : 4)}
          >
            <Bus className={clsx("text-[24px]", menuState === 4 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
            <span className={clsx("text-[10px] mt-1 font-medium", menuState === 4 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
              {t('nav.vehicle')}
            </span>
          </button>
        )}

        <button
          className="flex flex-col items-center justify-center transition-active active:scale-90 z-100 hover:bg-blue-50 dark:hover:bg-blue-600/15 px-2.5 rounded-md cursor-pointer"
          onClick={() => setMenuState(menuState === 5 ? 0 : 5)}
        >
          {(userLoggedIn && user.photoURL) ? (
            <img className="w-6 aspect-square rounded-full" src={user.photoURL} loading="lazy" />
          ) : (
            <UserCircle className={clsx("text-[24px]", menuState === 5 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
          )}
          <span className={clsx("text-[10px] mt-1 font-medium", menuState === 5 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
            {userLoggedIn ? user.displayName : t('nav.account')}
          </span>
        </button>
      </div>
    </div>
  )
}