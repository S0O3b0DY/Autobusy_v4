import { useRef, useEffect, useCallback } from "react"
import { SliderAlt, Search, GitCommit, Bus } from "@boxicons/react"
import clsx from "clsx"
import { useAppStore } from "../lib/store"

const SNAPS = [75, Math.round(window.innerHeight * 0.45), window.innerHeight - 40]
const nearest = (h: number) => SNAPS.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a))
const clamp = (h: number) => Math.min(Math.max(h, SNAPS[0]), SNAPS[2])

interface Props {
  children: React.ReactNode
  title?: string
}

export default function BottomSheet({ children, title }: Props) {
  const { menuState, setMenuState, selectedVehicle, selectedBusStop } = useAppStore()

  const sheetRef    = useRef<HTMLDivElement>(null)
  const handleRef   = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)
  const heightRef   = useRef(SNAPS[0])
  const dragging    = useRef(false)
  const startY      = useRef(0)
  const startH      = useRef(0)
  const velocityRef = useRef(0)
  const lastY       = useRef(0)
  const lastT       = useRef(0)
  const rafRef      = useRef<number | null>(null)

  const setHeight = useCallback((h: number, animated: boolean) => {
    if (!sheetRef.current || !contentRef.current) return
    heightRef.current = h
    sheetRef.current.style.transition = animated ? "height 0.35s cubic-bezier(0.32,0.72,0,1)" : "none"
    sheetRef.current.style.height = `${h}px`
    const collapsed = h === SNAPS[0]
    contentRef.current.style.opacity = collapsed ? "0" : "1"
    contentRef.current.style.pointerEvents = collapsed ? "none" : "auto"
  }, [])

  // init
  useEffect(() => { setHeight(SNAPS[0], false) }, [])

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
      const now = performance.now()
      const dt = now - lastT.current
      if (dt > 0) velocityRef.current = (lastY.current - clientY) / dt // px/ms, pozytywny = w górę
      lastY.current = clientY
      lastT.current = now

      const next = clamp(startH.current + startY.current - clientY)
      if (sheetRef.current) sheetRef.current.style.height = `${next}px`

      // pokaż content gdy wystarczająco wysoko
      if (contentRef.current) {
        const ratio = Math.max(0, (next - SNAPS[0]) / (SNAPS[1] - SNAPS[0]))
        contentRef.current.style.opacity = String(Math.min(ratio * 2, 1))
      }
    })
  }, [])

  const onUp = useCallback((clientY: number) => {
    if (!dragging.current) return
    dragging.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const current = clamp(startH.current + startY.current - clientY)
    const v = velocityRef.current // px/ms w górę

    let target: number
    if (v > 1.2) {
      // szybki swipe w górę — skocz do następnego snapa
      const idx = SNAPS.findIndex(s => s >= current)
      target = SNAPS[Math.min(idx + (idx === 0 ? 1 : 0), SNAPS.length - 1)] ?? SNAPS[SNAPS.length - 1]
    } else if (v < -1.2) {
      // szybki swipe w dół — skocz do poprzedniego snapa
      const idx = [...SNAPS].reverse().findIndex(s => s <= current)
      const realIdx = SNAPS.length - 1 - idx
      target = SNAPS[Math.max(realIdx - (realIdx === SNAPS.length - 1 ? 1 : 0), 0)] ?? SNAPS[0]
    } else {
      target = nearest(current)
    }

    setHeight(target, true)

    if (startH.current === SNAPS[0] && target > SNAPS[0] && menuState === 0) {
      setMenuState(1) // Filtruj
    }

  }, [setHeight, menuState])

  // mouse
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

  // touch — passive: false tylko na handle żeby nie blokować scroll contentu
  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    const start = (e: TouchEvent) => onDown(e.touches[0].clientY)
    const move  = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientY) }
    const end   = (e: TouchEvent) => onUp(e.changedTouches[0].clientY)

    handle.addEventListener("touchstart", start, { passive: true })
    handle.addEventListener("touchmove",  move,  { passive: false })
    handle.addEventListener("touchend",   end,   { passive: true })
    return () => {
      handle.removeEventListener("touchstart", start)
      handle.removeEventListener("touchmove",  move)
      handle.removeEventListener("touchend",   end)
    }
  }, [onDown, onMove, onUp])

  useEffect(() => {
    if (!sheetRef.current) return
    if (menuState !== 0) setHeight(SNAPS[1], true)
    if (menuState === 0) setHeight(SNAPS[0], true)
  }, [menuState])

  useEffect(() => { if (selectedBusStop !== null && menuState === 3 ) setMenuState(3) }, [selectedBusStop])
  useEffect(() => { if (selectedVehicle !== null && menuState === 4 ) setMenuState(4) }, [selectedVehicle])

  return (
    <div
      ref={sheetRef}
      style={{ height: SNAPS[0], willChange: "height", WebkitBackdropFilter: "blur(24px) saturate(180%)",
        backdropFilter: "blur(24px) saturate(180%)",
      }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0
        w-full max-w-2xl z-50 bg-white/95 dark:bg-neutral-900/90 border border-black/10
        dark:border-white/10 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* handle — jedyny obszar drag */}
      <div
        ref={handleRef}
        className="shrink-0 flex flex-col items-center gap-2 pt-3 pb-2 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none", userSelect: "none" }}
        onMouseDown={(e) => onDown(e.clientY)}
      >
        <div className="w-50 h-1 rounded-full bg-black/20 dark:bg-white/25" />
        {title && (
          <span className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 tracking-tight pb-1">
            {title}
          </span>
        )}
      </div>

      <div className="h-px bg-black/6 dark:bg-white/8 shrink-0" />

      
      {/* content — normalny scroll, bez blokowania */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto overscroll-contain pb-8"
        style={{ opacity: 0, pointerEvents: "none", transition: "opacity 0.2s ease" }}
      >
        {children}
      </div>
      <div className="absolute bottom-0 flex w-full px-10 justify-center gap-10 h-10 items-center bg-white/90
        py-6 rounded-t-2xl backdrop-blur-3xl dark:bg-neutral-900/70">
        <button className="flex flex-col items-center justify-center transition-active active:scale-90" onClick={() => setMenuState(menuState === 1 ? 0 : 1)}>
          <SliderAlt className={clsx("text-[24px]", menuState === 1 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
          <span className={clsx("text-[10px] mt-1 font-medium", menuState === 1 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
            Filtruj
          </span>
        </button>

        <button className="flex flex-col items-center justify-center transition-active active:scale-90" onClick={() => setMenuState(menuState === 2 ? 0 : 2)}>
          <Search className={clsx("text-[24px]", menuState === 2 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
          <span className={clsx("text-[10px] mt-1 font-medium", menuState === 2 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
            Szukaj
          </span>
        </button>

        {selectedBusStop && <button className="flex flex-col items-center justify-center transition-active active:scale-90" onClick={() => setMenuState(menuState === 3 ? 0 : 3)}>
          <GitCommit  className={clsx("text-[24px]", menuState === 3 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
          <span className={clsx("text-[10px] mt-1 font-medium", menuState === 3 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
            Przystanek
          </span>
        </button>}

        {selectedVehicle && <button className="flex flex-col items-center justify-center transition-active active:scale-90" onClick={() => setMenuState(menuState === 4 ? 0 : 4)}>
          <Bus  className={clsx("text-[24px]", menuState === 4 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")} />
          <span className={clsx("text-[10px] mt-1 font-medium", menuState === 4 ? "text-[#007AFF]" : "text-gray-500 dark:text-gray-400")}>
            Pojazd
          </span>
        </button>}
      </div>
    </div>
  )
}