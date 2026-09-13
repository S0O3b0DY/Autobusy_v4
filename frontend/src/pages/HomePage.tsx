// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import hero from "/assets/hero.webp"
import departuresBoard from "/assets/departures.png" // 489×505px — realny screen tablicy odjazdów
import clsx from "clsx"

import { Stopwatch, Star, MapIcon, BellRing, ChevronDown, QuoteLeft } from "@boxicons/react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import AppCTA from "../components/AppCTA.tsx"

import { useState, useEffect, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

import { faqData } from "../const/homePage.ts"
import { Helmet } from "react-helmet"

gsap.registerPlugin(ScrollTrigger)

// ─── Dane ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 300,  suffix: "+", label: "pojazdów live" },
  { value: 2400, suffix: "+", label: "przystanków" },
  { value: 10,   suffix: "s", label: "opóźnienie GPS" },
  { value: 100,  suffix: "%", label: "bezpłatnie" },
]

// Źródła danych — karuzela w sekcji "Dane od"
const DATA_SOURCES = [
  "MPK Łódź", "ZDiT Łódź", "GTFS-RT", "Otwarte Dane Łódź",
  "System ITS Łódź", "Firebase", "OpenStreetMap",
]

// Punkty porównania: z aplikacją vs. bez
const COMPARISON = [
  { without: "Stoisz na przystanku i zgadujesz, czy autobus zaraz przyjedzie",  withApp: "Widzisz dokładny czas przyjazdu — co do minuty" },
  { without: "Dowiadujesz się o objeździe dopiero na miejscu",                  withApp: "Powiadomienie o utrudnieniu, zanim wyjdziesz z domu" },
  { without: "Sprawdzasz papierowy rozkład, który jest nieaktualny",           withApp: "Rozkład zawsze zgodny z bieżącymi zmianami tras" },
  { without: "Bez internetu nie wiesz nic o swojej linii",                     withApp: "Mapy i rozkłady dostępne offline" },
]

// Opinie użytkowników
const TESTIMONIALS = [
  {
    quote: "Odkąd korzystam z UrbanTransit, przestałem stresować się porannymi opóźnieniami. Widzę dokładnie, kiedy wyjść z domu.",
    name: "Kamil W.",
    city: "Łódź, Widzew",
  },
  {
    quote: "Tablica na żywo jest dokładnie tym, czego brakowało mi na przystankach bez wyświetlacza. Genialnie proste.",
    name: "Ania K.",
    city: "Łódź, Bałuty",
  },
  {
    quote: "Powiadomienia o objazdach uratowały mnie kilka razy w tym miesiącu. Aplikacja, której faktycznie używam codziennie.",
    name: "Marek S.",
    city: "Łódź, Górna",
  },
]

export default function HomePage() {
  const { userLoggedIn, user } = useAuth()
  const [faqList, setFaqList] = useState<number[]>([])

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const pageRef        = useRef<HTMLDivElement>(null)
  const heroTitleRef    = useRef<HTMLHeadingElement>(null)
  const heroSubRef      = useRef<HTMLParagraphElement>(null)
  const heroCTARef      = useRef<HTMLDivElement>(null)
  const heroImgRef      = useRef<HTMLDivElement>(null)
  const heroSectionRef  = useRef<HTMLDivElement>(null)

  const marqueeTrackRef = useRef<HTMLDivElement>(null)
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null)

  const comparisonRef   = useRef<HTMLDivElement>(null)
  const comparisonMaskRef = useRef<HTMLDivElement>(null)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  // ─── GSAP ─────────────────────────────────────────────────────────────────
  useGSAP(() => {

    // ── 1. Hero: jeden zsynchronizowany wjazd ────────────────────────────
    gsap.timeline({ delay: 0.1 })
      .from(heroTitleRef.current, { y: 64, opacity: 0, duration: 0.85, ease: "power4.out" }, "-=0.2")
      .from(heroSubRef.current,   { y: 28, opacity: 0, duration: 0.65, ease: "power3.out" }, "-=0.55")
      .from(heroCTARef.current,   { y: 16, opacity: 0, duration: 0.5,  ease: "power2.out" }, "-=0.45")
      .from(heroImgRef.current,   { x: 80, opacity: 0, scale: 0.93, duration: 1.1, ease: "power3.out" }, "-=1.0")

    // ── 1b. Parallax telefonów podczas scrollowania poza hero ────────────
    gsap.to(heroImgRef.current, {
      y: -60,
      rotate: -2,
      scrollTrigger: {
        trigger: heroSectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    })

    // ── 2. Bento: wejście "z materiału" + spotlight podążający za kursorem ─
    gsap.utils.toArray<HTMLElement>(".bento-card").forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: "top 90%" },
        scale: 0.94, opacity: 0, y: 24,
        duration: 0.7, delay: i * 0.06,
        ease: "power3.out",
      })

      const spot = card.querySelector<HTMLElement>(".bento-spotlight")
      if (!spot) return
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        gsap.to(spot, {
          "--x": `${e.clientX - r.left}px`,
          "--y": `${e.clientY - r.top}px`,
          opacity: 1,
          duration: 0.3,
          overwrite: true,
        } as gsap.TweenVars)
      }
      const onLeave = () => gsap.to(spot, { opacity: 0, duration: 0.4 })
      card.addEventListener("mousemove", onMove)
      card.addEventListener("mouseleave", onLeave)
    })

    // ── 3. Statystyki: elastyczny pop-in + count-up ──────────────────────
    gsap.utils.toArray<HTMLElement>(".stat-item").forEach((item, i) => {
      gsap.from(item, {
        scrollTrigger: { trigger: item, start: "top 90%" },
        y: 30, opacity: 0, scale: 0.8,
        duration: 0.6, delay: i * 0.08,
        ease: "back.out(2)",
      })
    })
    gsap.utils.toArray<HTMLElement>(".stat-num").forEach(el => {
      const target = Number(el.dataset.target)
      const suffix = el.dataset.suffix ?? ""
      const obj = { val: 0 }
      ScrollTrigger.create({
        trigger: el, start: "top 85%", once: true,
        onEnter: () => gsap.to(obj, {
          val: target, duration: 1.8, ease: "power2.out",
          onUpdate() { el.textContent = Math.round(obj.val) + suffix }
        })
      })
    })

    // ── 4. Marquee "Dane od" — nieskończone przewijanie, pauza na hover ──
    if (marqueeTrackRef.current) {
      marqueeTweenRef.current = gsap.to(marqueeTrackRef.current, {
        xPercent: -50,
        duration: 22,
        ease: "none",
        repeat: -1,
      })
    }

    // ── 5. Porównanie: scrubowany "wipe" ujawniający kolumnę z aplikacją ─
    if (comparisonMaskRef.current) {
      gsap.set(comparisonMaskRef.current, { clipPath: "inset(0 100% 0 0)" })
      gsap.to(comparisonMaskRef.current, {
        clipPath: "inset(0 0% 0 0)",
        ease: "none",
        scrollTrigger: {
          trigger: comparisonRef.current,
          start: "top -10%",
          end: "bottom 40%",
          scrub: 0.8,
        },
      })
    }

    // ── 6. Testimoniale: 3D-ish stagger reveal ───────────────────────────
    gsap.from(".testimonial-card", {
      scrollTrigger: { trigger: ".testimonial-grid", start: "top 85%" },
      y: 50, opacity: 0, rotateX: -12, transformOrigin: "top center",
      duration: 0.8, stagger: 0.15, ease: "power3.out",
    })

  }, { scope: pageRef })

  function pauseMarquee()  { marqueeTweenRef.current?.timeScale(0.15) }
  function resumeMarquee() { marqueeTweenRef.current?.timeScale(1) }

  if (user) return <Navigate to="/app" />

  return (
    <>
      <Helmet><title>UrbanTransit</title></Helmet>
      <div ref={pageRef} className="bg-bg-1 overflow-x-hidden">
        <AppCTA />
        <Header />

        {/* ════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════ */}
        <section ref={heroSectionRef} className="relative min-h-screen flex items-center px-6 pt-24 pb-16 max-w-7xl mx-auto">

          <div className="absolute -top-32 -right-32 w-135 h-135 rounded-full bg-primaty-900/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -left-20 w-90 h-90 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center w-full">

            <div className="flex flex-col gap-6 z-10">
              <h1
                ref={heroTitleRef}
                className="title leading-[1.05]"
                style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)" }}
              >
                Twoje miasto.<br />Zawsze na czas.
              </h1>

              <p ref={heroSubRef} className="text max-w-md text-[1.05rem]">
                Pozycje GPS autobusów i tramwajów, tablice odjazdów w czasie rzeczywistym
                i planowanie tras — w jednej, bezpłatnej aplikacji.
              </p>

              <div ref={heroCTARef} className="items-center md:items-start 
              flex-col flex flex-wrap gap-3 pt-1">
                <Link to={userLoggedIn ? "/app" : "/logowanie"}>
                  <button className="btn-full">
                    {userLoggedIn ? "Przejdź do aplikacji" : "Zacznij bezpłatnie"}
                  </button>
                </Link>
                <Link to="/kontakt">
                  <button className="btn-alt">Kontakt</button>
                </Link>
              </div>
            </div>

            <div ref={heroImgRef} className="flex justify-center md:justify-end">
              <img
                src={hero}
                alt="UrbanTransit — aplikacja mobilna"
                className="w-full max-w-xs md:max-w-md"
                style={{ filter: "drop-shadow(0 48px 96px rgba(0,0,0,0.14))" }}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            STATYSTYKI
        ════════════════════════════════════════════════════════════════ */}
        <div className="border-y-2 border-neutral-200 bg-white py-10 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x-2 divide-neutral-100">
            {STATS.map(({ value, suffix, label }) => (
              <div key={label} className="stat-item flex flex-col items-center gap-1 md:px-8">
                <span
                  className="stat-num text-[2.6rem] font-black text-primaty-900 leading-none"
                  data-target={value}
                  data-suffix={suffix}
                >
                  0{suffix}
                </span>
                <span className="text-sm text-neutral-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            BENTO FEATURES
        ════════════════════════════════════════════════════════════════ */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <h2 className="title mb-4">Podróżuj bez ograniczeń</h2>
            <p className="text">
              Zaprojektowaliśmy UrbanTransit, aby rozwiązać Twoje największe problemy komunikacyjne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* ─ Karta 1: Tablica odjazdów na żywo (duża, 7/12) — realny screen ─ */}
            <div className="bento-card relative md:col-span-7 bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-sm overflow-hidden flex flex-col md:flex-row gap-6 items-center">
              <div
                className="bento-spotlight pointer-events-none absolute inset-0 opacity-0 rounded-3xl"
                style={{
                  background: "radial-gradient(280px circle at var(--x,50%) var(--y,50%), rgba(59,130,246,0.08), transparent 70%)"
                }}
              />
              <div className="flex-1 flex flex-col gap-4 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#E7E8EA] rounded-xl">
                    <Stopwatch />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Tablica odjazdów na żywo</h3>
                    <p className="card-text text-[12px]">GPS aktualizowany co kilkanaście sekund</p>
                  </div>
                </div>
                <p className="card-text">
                  Ten sam widok co na wyświetlaczu przystankowym — teraz w Twojej kieszeni.
                  Zobacz dokładnie, ile minut zostało do Twojego autobusu lub tramwaju.
                </p>
              </div>

              {/* Screen: 489×505px (proporcja ~0.97:1) — realny zrzut ekranu tablicy odjazdów */}
              <img
                src={departuresBoard}
                alt="Podgląd tablicy odjazdów UrbanTransit — przystanek Piotrkowska Centrum"
                className="w-full max-w-[280px] md:max-w-[240px] rounded-2xl shadow-lg shrink-0 z-10"
              />
            </div>

            {/* ─ Karta 2: Ulubione linie (5/12) ─ */}
            <div className="bento-card relative md:col-span-5 bg-[#E2FEF1] rounded-3xl border-2 border-green-100 p-8 flex flex-col gap-5 overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/60 rounded-xl">
                  <Star fill="#006C49" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Ulubione linie</h3>
                  <p className="card-text text-[12px]">Szybki dostęp po otwarciu aplikacji</p>
                </div>
              </div>
              <p className="card-text">
                Zapisuj linie i przystanki, z których korzystasz najczęściej.
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {["1", "5", "14", "71", "98", "A", "3", "52"].map(l => (
                  <span key={l} className="bg-white/80 border border-green-200 text-[#006C49] font-black text-sm px-3 py-1.5 rounded-xl shadow-sm">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* ─ Karta 3: Mapy offline (5/12) ─ */}
            <div className="bento-card relative md:col-span-5 bg-[#F6F6FF] rounded-3xl border-2 border-indigo-100 p-8 flex flex-col gap-5 overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/60 rounded-xl">
                  <MapIcon fill="#2F2EBE" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Mapy offline</h3>
                  <p className="card-text text-[12px]">Brak internetu? Żaden problem</p>
                </div>
              </div>
              <p className="card-text">
                Pobierz mapy i rozkłady jazdy, aby mieć do nich dostęp w każdej chwili.
              </p>
              <div className="mt-auto flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <MapIcon size="sm" fill="#2F2EBE" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-indigo-900">Łódź — pełna sieć</p>
                  <p className="text-[11px] text-indigo-600">Pobrano · dostępna offline</p>
                </div>
                <div className="ml-auto w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
              </div>
            </div>

            {/* ─ Karta 4: Powiadomienia (7/12) ─ */}
            <div className="bento-card relative md:col-span-7 bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-sm flex flex-col gap-5 overflow-hidden">
              <div
                className="bento-spotlight pointer-events-none absolute inset-0 opacity-0 rounded-3xl"
                style={{
                  background: "radial-gradient(280px circle at var(--x,50%) var(--y,50%), rgba(239,68,68,0.06), transparent 70%)"
                }}
              />
              <div className="flex items-center gap-3 z-10">
                <div className="flex items-center justify-center w-10 h-10 bg-[#FFF4F3] rounded-xl">
                  <BellRing fill="#BA1A1A" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Powiadomienia o utrudnieniach</h3>
                  <p className="card-text text-[12px]">Korki, objazdy, zmiany na trasach</p>
                </div>
              </div>
              <p className="card-text max-w-sm z-10">
                Bądź na bieżąco z wszystkimi zmianami na swoich trasach — zanim wyjdziesz z domu.
              </p>
              <div className="flex flex-col gap-2 mt-auto z-10">
                <div className="bg-[#FFF4F3] border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="w-1 h-full min-h-[2rem] bg-red-400 rounded-full shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-red-900">Objazd · Linia 14 i 3</p>
                    <p className="text-[11px] text-red-600 mt-0.5">Awaria sieci trakcyjnej przy pl. Wolności. Objazd przez ul. Narutowicza.</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="w-1 h-full min-h-[1.5rem] bg-amber-400 rounded-full shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-amber-900">Opóźnienie · Linia 71</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Spodziewane opóźnienie ~8 min z powodu korku na ul. Piotrkowskiej.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ Karta 5: Nowe linie i zmiany rozkładu (12/12) — miejsce na screen ─ */}
            {/* TODO: podmienić na realny zrzut ekranu. Zarezerwowane wymiary: 1040×360px  */}
            {/* (proporcja ~2.9:1 — szeroki changelog/timeline widok, desktop-first) */}
            <div className="bento-card relative md:col-span-12 bg-neutral-950 rounded-3xl p-8 flex flex-col md:flex-row gap-6 items-center overflow-hidden">
              <div className="flex-1 flex flex-col gap-3 z-10">
                <span className="self-start text-[11px] font-mono font-bold text-white/50 uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full">
                  Changelog
                </span>
                <h3 className="text-xl font-black text-white">Nowe linie i zmiany rozkładu</h3>
                <p className="text-white/60 text-[14px] max-w-md">
                  Śledź na bieżąco zmiany tras i nowe połączenia MPK Łódź — zanim jeszcze
                  zorientujesz się na przystanku.
                </p>
              </div>
              {/* Kontener na screen — wymiary docelowe: 1040×360px */}
              <div
                className="w-full md:w-[55%] shrink-0 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/30 text-xs font-mono z-10"
                style={{ aspectRatio: "1040 / 360" }}
              >
                miejsce na zrzut ekranu (1040×360px)
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            DANE OD — marquee, pauza na hover
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-y-2 border-neutral-200 bg-white overflow-hidden">
          <p className="text-center text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest mb-8">
            Dane od
          </p>
          <div
            className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]"
            onMouseEnter={pauseMarquee}
            onMouseLeave={resumeMarquee}
          >
            <div ref={marqueeTrackRef} className="flex w-max gap-16 items-center">
              {[...DATA_SOURCES, ...DATA_SOURCES].map((name, i) => (
                <span
                  key={name + i}
                  className="text-2xl font-black text-neutral-300 hover:text-neutral-500 transition-colors whitespace-nowrap cursor-default"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PORÓWNANIE: Z APLIKACJĄ VS. BEZ — scrubowany wipe
        ════════════════════════════════════════════════════════════════ */}
        <section ref={comparisonRef} className="px-6 py-24 max-w-5xl mx-auto">
          <div className="mb-14 text-center max-w-xl mx-auto">
            <h2 className="title mb-4">Różnica, którą czuć od razu</h2>
            <p className="text">To samo miasto, ten sam przystanek — inne doświadczenie.</p>
          </div>

          <div className="relative rounded-3xl overflow-hidden border-2 border-neutral-200 shadow-sm">
            {/* Warstwa spodnia: BEZ aplikacji */}
            <div className="bg-neutral-100 p-8 md:p-10 flex flex-col gap-5">
              <span className="self-start text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                Bez UrbanTransit
              </span>
              {COMPARISON.map(({ without }) => (
                <p key={without} className="text-neutral-500 text-[15px] leading-snug">
                  {without}
                </p>
              ))}
            </div>

            {/* Warstwa wierzchnia: Z aplikacją, odsłaniana przez clip-path podczas scrolla */}
            <div
              ref={comparisonMaskRef}
              className="absolute inset-0 bg-primaty-900 p-8 md:p-10 flex flex-col gap-5"
            >
              <span className="self-start text-[11px] font-mono font-bold text-white/50 uppercase tracking-widest">
                Z UrbanTransit
              </span>
              {COMPARISON.map(({ withApp }) => (
                <p key={withApp} className="text-white text-[15px] leading-snug font-medium">
                  {withApp}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            JAK TO DZIAŁA
        ════════════════════════════════════════════════════════════════ */}
        <section className="bg-[#EFF4FF] px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <h2 className="title text-center mb-16">Jak to działa?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-0.5 bg-neutral-300 z-0" />
              {[
                { n: "1", title: "Wyszukaj", desc: "Sprawdź pozycję pojazdu na mapie lub wyszukaj przystanek, by od razu zobaczyć tablicę odjazdów." },
                { n: "2", title: "Śledź", desc: "Kliknij pojazd, aby zobaczyć całą jego trasę, kolejne odjazdy i informacje o nim." },
                { n: "3", title: "Ruszaj w drogę", desc: "Jedź spokojnie. Wiedząc dokładnie, kiedy i gdzie przyjedzie Twój transport." },
              ].map(({ n, title, desc }) => (
                <div key={n} className="hiw-card">
                  <div className="relative z-10">{n}</div>
                  <h4>{title}</h4>
                  <p className="text">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            OPINIE UŻYTKOWNIKÓW
        ════════════════════════════════════════════════════════════════ */}
        <section className="px-6 py-24 max-w-6xl mx-auto">
          <div className="mb-14 text-center max-w-xl mx-auto">
            <h2 className="title mb-4">Ludzie, którzy już oszczędzają czas</h2>
            <p className="text">Prawdziwe historie od użytkowników UrbanTransit w Łodzi.</p>
          </div>

          <div className="testimonial-grid grid grid-cols-1 md:grid-cols-3 gap-6" style={{ perspective: "1000px" }}>
            {TESTIMONIALS.map(({ quote, name, city }) => (
              <div
                key={name}
                className="testimonial-card bg-white border-2 border-neutral-200 rounded-3xl p-7 flex flex-col gap-5 shadow-sm"
              >
                <QuoteLeft size="md" className="text-primaty-900/20" />
                <p className="text-[14.5px] text-neutral-700 leading-relaxed flex-1">
                  "{quote}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
                  <div className="w-9 h-9 rounded-full bg-primaty-900/10 flex items-center justify-center text-sm font-black text-primaty-900">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900 leading-tight">{name}</p>
                    <p className="text-[12px] text-neutral-400">{city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FAQ
        ════════════════════════════════════════════════════════════════ */}
        <section className="px-6 py-24 max-w-4xl mx-auto">
          <h2 className="title text-center mb-12">Często zadawane pytania</h2>
          <div className="grid grid-cols-1 gap-4">
            {faqData.map(item => {
              const showAns = faqList.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => setFaqList(prev =>
                    showAns ? prev.filter(id => id !== item.id) : [...prev, item.id]
                  )}
                  className="faq-card cursor-pointer overflow-hidden"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold pr-4">{item.header}</h3>
                    <ChevronDown size="md" className={clsx(showAns && "rotate-180", "transition-transform shrink-0")} />
                  </div>
                  <div className={clsx("grid transition-[grid-template-rows] duration-300", showAns ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <div className="text pl-5 pt-3 pb-2">
                        <p className="text-justify">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════════════════════════ */}
        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <div className="relative bg-primaty-900 rounded-3xl px-8 md:px-16 py-16 flex flex-col items-center gap-6 shadow-2xl overflow-hidden text-center">
            <h2 className="title text-white" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Gotowy na lepszą podróż?
            </h2>
            <p className="text text-white/75 text-lg max-w-xl">
              Dołącz do społeczności, która codziennie oszczędza czas dzięki UrbanTransit.
            </p>
            <Link to={userLoggedIn ? "/app" : "/logowanie"}>
              <button className="btn-full bg-white text-primaty-900 font-black mt-2 active:border-primaty-900">
                {userLoggedIn ? "Przejdź do aplikacji" : "Zacznij bezpłatnie"}
              </button>
            </Link>
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
            />
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}