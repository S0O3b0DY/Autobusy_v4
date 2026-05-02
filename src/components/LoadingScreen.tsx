
import { useEffect, useRef } from 'react'
import { Train } from "@boxicons/react"
import gsap from 'gsap'

// Rejestrujemy wtyczkę CustomEase

export default function TransportAppLoader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoBoxRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Tworzymy ultra-płynną krzywą "sprężyny" (iOS Style)
    // Ta krzywa powoduje szybki start, lekkie wyjście poza cel i miękki powrót.

    const tl = gsap.timeline()

    // ETAP 1: "Wystrzał" pociągu i morphing w pasek
    tl.to(iconRef.current, {
      x: -60, // Pociąg odjeżdża w lewo...
      opacity: 0, // ...i znika
      scale: 0.7,
      duration: 0.5,
      ease: "power3.in" // Przyspiesza przy odjeździe
    }, 0)
    .to(logoBoxRef.current, {
      height: "3px", // Logo spłaszcza się do minimalnej linii
      width: "100%", // Rozciąga się na pełną szerokość
      borderRadius: "2px", // Bardziej ostre rogi dla paska
      backgroundColor: "#3b82f6", // Zmieniamy kolor na niebieski (blue-500)
      duration: .5,
      ease: "expo.inOut" // Używamy naszej customowej sprężyny
    }, 0.1) // Startuje minimalnie później niż odjazd pociągu
    
    // ETAP 2: Satysfakcjonujące "wciśnięcie" paska (jak w iOS)
    .to(logoBoxRef.current, {
      scaleX: 0, // Zwijamy pasek...
      transformOrigin: "right center", // ...do prawej strony
      duration: 0.5,
      ease: "expo.inOut" // Bardzo gładkie, "drogie" wygaszanie
    }, "+=0.2") // Czekamy chwilę, żeby zobaczyć pełny pasek

    // ETAP 3: Reveal aplikacji (Dissolve)
    .to(containerRef.current, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        if (containerRef.current) containerRef.current.style.display = 'none';
      }
    }, "-=0.4") // Zaczyna znikać pod koniec zwijania paska
  }, [])

  return (
    <div 
      ref={containerRef}
      // Tło z efektem mrożonego szkła (iOS backdrop-blur)
      className="fixed inset-0 z-9999 flex items-center justify-center dark:bg-zinc-950/95 backdrop-blur-xl transition-colors"
    >
      {/* Kontener ograniczający szerokość paska postępu na desktopie */}
      <div className="w-full max-w-sm px-8 flex justify-center">
        
        {/* NIEBIESKIE LOGO / PASEK (Pudełko) */}
        <div 
          ref={logoBoxRef}
          // Zaczynamy od niebieskiego Squircle (rounded-[22%])
          className="relative flex items-center justify-center w-17.5 h-17.5 rounded-[22%] overflow-hidden shadow-lg shadow-blue-500/10"
        >
          {/* IKONA POCIĄGU */}
          <div ref={iconRef} className="text-white text-4xl">
            <Train size="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
