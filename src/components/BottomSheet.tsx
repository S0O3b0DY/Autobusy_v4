import { useState, useRef, useEffect } from "react"

const SNAPS = [64, 400, window.innerHeight - 40]
const nearest = (h: number) => SNAPS.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a))
const clamp = (h: number) => Math.min(Math.max(h, SNAPS[0]), SNAPS[2])

interface Props {
  children: React.ReactNode
  title?: string
}

export default function Menu({ children, title }: Props) {
  const [height, setHeight] = useState(SNAPS[0])
  const [dragging, setDragging] = useState(false)
  const start = useRef({ y: 0, h: 0 })

  const onDown = (clientY: number) => {
    setDragging(true)
    start.current = { y: clientY, h: height }
  }

  const onMove = (clientY: number) =>
    setHeight(clamp(start.current.h + start.current.y - clientY))

  const onUp = (clientY: number) => {
    setDragging(false)
    setHeight(nearest(clamp(start.current.h + start.current.y - clientY)))
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => onMove(e.clientY)
    const up = (e: MouseEvent) => onUp(e.clientY)
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
  }, [dragging])

  return (
    <div
      style={{
        height,
        transition: dragging ? "none" : "height 0.4s cubic-bezier(0.32,0.72,0,1)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backdropFilter: "blur(20px) saturate(180%)",
      }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 lg:right-0 w-full max-w-lg z-50
        bg-white/75 dark:bg-neutral-900/75
        border border-white/40 dark:border-white/10
        rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* drag handle area */}
      <div
        style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none", userSelect: "none" }}
        className="shrink-0 flex flex-col items-center pt-2.5 pb-1"
        onMouseDown={(e) => onDown(e.clientY)}
        onTouchStart={(e) => onDown(e.touches[0].clientY)}
        onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientY) }}
        onTouchEnd={(e) => onUp(e.changedTouches[0].clientY)}
      >
        <div className="w-9 h-1.25 rounded-full bg-black/20 dark:bg-white/25" />
      </div>

      {/* title */}
      {title && (
        <div className="shrink-0 px-5 pt-1 pb-3 border-b border-black/6 dark:border-white/8">
          <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            {title}
          </h2>
        </div>
      )}

      {/* content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        {children}
      </div>
    </div>
  )
}