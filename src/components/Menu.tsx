
// hooks
import React, { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useAppStore } from "../lib/store"

// components
import Filter from './Filter'
import StopSearch from './StopSearch'
import BusStop from './BusStop'
import Vehicle from './Vehicle'
import Profile from './Profile'

// types
import type { BusStopData } from '../types'

// constants
// other
import gsap from "gsap"



type Props = {
  currentRouteIdRef: RefObject<number | null>,
  routeStopsRef: RefObject<BusStopData[] | null>
}

export default function Menu({ currentRouteIdRef, routeStopsRef }: Props) {
  const { menuState } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)
  
  // displayState przechowuje to, co fizycznie jest teraz na ekranie
  const [displayState, setDisplayState] = useState(menuState)
  const prevMenuState = useRef<number>(menuState)

  // KROK 1: Reagujemy na kliknięcie. Najpierw WYJAZD starego elementu.
  useEffect(() => {
    if (menuState === displayState) return

    const el = ref.current
    if (!el) return

    // Jeśli startujemy od zera (otwieramy menu), od razu pozwalamy na render
    if (displayState === 0) {
      setDisplayState(menuState)
      return
    }

    const isGoingRight = menuState > displayState
    
    // Zatrzymujemy poprzednią animację, na wypadek gdyby użytkownik klikał za szybko
    gsap.killTweensOf(el) 
    
    gsap.to(el, {
      x: isGoingRight ? -80 : 80, // Przesunięcie w px (bezpieczniejsze niż %)
      y: 10,
      opacity: 0, 
      scale: 0.98, 
      duration: 0.15, 
      ease: "power4.in",
      onComplete: () => {
        // DOPIERO gdy zniknie, zmieniamy stan (React podmienia komponenty)
        setDisplayState(menuState)
      }
    })

  }, [menuState, displayState])

  // KROK 2: React wkleił nowy komponent. Odpalamy animację WEJŚCIA.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Jeśli całkowicie zamknęliśmy menu, resetujemy pamięć kierunku
    if (displayState === 0) {
      prevMenuState.current = 0
      return
    }

    if (displayState !== prevMenuState.current) {
      const isGoingRight = displayState > prevMenuState.current
      
      // Gdy menu się dopiero otwiera z (0), wjeżdżamy delikatnie z dołu. 
      // W innym przypadku wjeżdżamy z odpowiedniego boku.
      const startX = prevMenuState.current === 0 ? 0 : (isGoingRight ? 80 : -80)
      const startY = prevMenuState.current === 0 ? 10 : 0
      
      gsap.killTweensOf(el)
      
      gsap.fromTo(el,
        { x: startX, y: startY, opacity: 0, scale: 0.98 },
        { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.15, ease: "power1.out" }
      )

      prevMenuState.current = displayState
    }
  }, [displayState])

  const content: Record<number, React.ReactNode> = {
    1: <Filter />,
    2: <StopSearch routeStopsRef={routeStopsRef} />,
    3: <BusStop routeStopsRef={routeStopsRef} />,
    4: <Vehicle currentRouteIdRef={currentRouteIdRef} routeStopsRef={routeStopsRef} />,
    5: <Profile />,
  }

  return (
    // Najbezpieczniejsza opcja dla GSAP: nie usuwamy kontenera przez "return null", 
    // tylko chowamy go i wyłączamy interakcje. Dzięki temu "ref" zawsze istnieje.
    <div 
      className="w-full"
      style={{ 
        opacity: displayState === 0 ? 0 : 1, 
        pointerEvents: displayState === 0 ? 'none' : 'auto',
        visibility: displayState === 0 ? 'hidden' : 'visible'
      }}
    >
      <div ref={ref} className="w-full will-change-transform">
        {content[displayState] ?? null}
      </div>
    </div>
  )
}