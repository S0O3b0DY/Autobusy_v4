<<<<<<< HEAD
import React, { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
=======
import React, { useEffect, useRef } from 'react'
>>>>>>> main
import { useAppStore } from "../lib/store"
import gsap from "gsap"

import Filter from './Filter'
import StopSearch from './StopSearch'
import BusStop from './BusStop'
import Vehicle from './Vehicle'
<<<<<<< HEAD
import Profile from './Profile'
import type { BusStopData } from '../types'
=======

>>>>>>> main

type Props = {
  currentRouteIdRef: RefObject<number | null>,
  routeStopsRef: RefObject<BusStopData[] | null>
}

export default function Menu({ currentRouteIdRef, routeStopsRef }: Props) {
  const { menuState } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)
  const prevState = useRef<number>(menuState)

  useEffect(() => {
    if (!ref.current) return

    // console.log(menuState)

    const el = ref.current
    const isSwichingRight = menuState > prevState.current ? 1 : 0

    gsap.to(el, {
      x: isSwichingRight ? -20 : 20, opacity: 0, scale: 0.97, duration: 0.18, ease: "expo.in",
      onComplete: () => {
        prevState.current = menuState

        gsap.fromTo(el,
          { x: isSwichingRight ? 20 : -20, opacity: 0, scale: 0.97 },
          { x: 0, opacity: 1, scale: 1, duration: 0.35, ease: "expo.out" }
        )
      }
    })

    prevState.current = menuState
  }, [menuState])

  const content: Record<number, React.ReactNode> = {
    1: <Filter />,
<<<<<<< HEAD
    2: <StopSearch routeStopsRef={routeStopsRef} />,
    3: <BusStop routeStopsRef={routeStopsRef} />,
    4: <Vehicle currentRouteIdRef={currentRouteIdRef} routeStopsRef={routeStopsRef} />,
    5: <Profile />,
=======
    2: <StopSearch BSMarkersRef={BSMarkersRef} />,
    3: <BusStop />,
    4: <Vehicle BSMarkersRef={BSMarkersRef} currentRouteIdRef={currentRouteIdRef} />,
>>>>>>> main
  }

  return (
    <div ref={ref} style={{ opacity: menuState === 0 ? 0 : 1 }}>
      {content[menuState] ?? null}
    </div>
  )
}