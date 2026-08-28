// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useEffect, useRef, useState } from 'react'

// components
import { Train } from "@boxicons/react"

// types
// constants
import { LOADING_MESSAGES } from '../const/app'

// other
import gsap from 'gsap'



export default function TransportAppLoader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoBoxRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  // kontener kropek + tekstu — pojawia się i znika ZAWSZE razem, nigdy sam tekst
  const statusRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([])
  const textRefs = useRef<(HTMLSpanElement | null)[]>([])

  const [introDone, setIntroDone] = useState(false)

  // ETAP WSTĘPNY: "wystrzał" pociągu -> morphing w pasek -> zwinięcie paska
  useEffect(() => {
    gsap.set(statusRef.current, { opacity: 0, y: 12 })
    textRefs.current.forEach((el, i) => {
      if (!el) return
      gsap.set(el, { opacity: i === 0 ? 1 : 0, y: 0 })
    })

    const tl = gsap.timeline({
      onComplete: () => setIntroDone(true)
    })

    tl.to(iconRef.current, {
      x: -60,
      opacity: 0,
      scale: 0.7,
      duration: 0.5,
      ease: "power3.in"
    }, 0)
    .to(logoBoxRef.current, {
      height: "3px",
      width: "100%",
      borderRadius: "2px",
      backgroundColor: "#3b82f6",
      duration: 0.5,
      ease: "expo.inOut"
    }, 0.1)
    .to(logoBoxRef.current, {
      scaleX: 0,
      transformOrigin: "right center",
      duration: 0.5,
      ease: "expo.inOut"
    }, "+=0.2")
    // kropki + tekst wjeżdżają RAZEM, dopiero gdy animacja wstępna jest skończona
    .to(statusRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: "power2.out"
    }, "-=0.25")

    return () => {
      tl.kill()
    }
  }, [])

  // PULSOWANIE KROPEK — trwa cały czas ładowania, aż komponent zostanie odmontowany
  useEffect(() => {
    if (!introDone) return

    const tl = gsap.timeline({ repeat: -1 })
    tl.to(dotsRef.current, {
      opacity: 0.25,
      y: -3,
      duration: 0.35,
      stagger: 0.15,
      ease: "power1.inOut"
    })
    .to(dotsRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      stagger: 0.15,
      ease: "power1.inOut"
    })

    return () => {
      tl.kill()
    }
  }, [introDone])

  // KARUZELA TEKSTÓW — stary tekst "wyjeżdża" do góry i znika,
  // nowy "wjeżdża" z dołu w jego miejsce
  useEffect(() => {
    if (!introDone) return

    let current = 0
    const total = LOADING_MESSAGES.length

    const id = setInterval(() => {
      const next = (current + 1) % total
      const oldEl = textRefs.current[current]
      const newEl = textRefs.current[next]

      if (oldEl) {
        gsap.to(oldEl, {
          y: -18,
          opacity: 0,
          duration: 0.45,
          ease: "power2.inOut"
        })
      }

      if (newEl) {
        gsap.set(newEl, { y: 18, opacity: 0 })
        gsap.to(newEl, {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: "power2.inOut",
          delay: 0.08
        })
      }

      current = next
    }, 2600)

    return () => clearInterval(id)
  }, [introDone])

  return (
    <div
      ref={containerRef}
      // Tło z efektem mrożonego szkła (iOS backdrop-blur)
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-7 dark:bg-zinc-950/95 backdrop-blur-xl transition-colors"
    >
      {/* Kontener ograniczający szerokość paska postępu na desktopie */}
      <div className="w-full max-w-sm px-8 flex justify-center">
        {/* NIEBIESKIE LOGO / PASEK (Pudełko) */}
        <div
          ref={logoBoxRef}
          // Zaczynamy od niebieskiego Squircle (rounded-[22%])
          className="relative flex items-center justify-center w-17.5 h-17.5 rounded-[22%] overflow-hidden shadow-lg shadow-blue-500/10 bg-blue-500"
        >
          {/* IKONA POCIĄGU */}
          <div ref={iconRef} className="text-white text-4xl">
            <Train size="lg" />
          </div>
        </div>
      </div>

      {/* KROPKI + KARUZELA TEKSTÓW — zawsze razem, nigdy osobno */}
      <div ref={statusRef} className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              ref={(el) => { dotsRef.current[i] = el }}
              className="w-2 h-2 rounded-full bg-blue-500"
            />
          ))}
        </div>

        <div className="relative h-6 w-72 overflow-hidden">
          {LOADING_MESSAGES.map((msg, i) => (
            <span
              key={msg}
              ref={(el) => { textRefs.current[i] = el }}
              className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-sm font-mono uppercase font-bold tracking-wide text-zinc-700"
            >
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}