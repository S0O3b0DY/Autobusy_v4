// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.
import logo from "/logo.svg"
import hero from "/hero.webp"
import clsx from "clsx"

import { Stopwatch, Star, MapIcon, BellRing, ChevronDown, User, X, Window, ArrowOutRightSquareHalf } from "@boxicons/react"

import { useState } from "react"
import { doSignOut } from './../lib/authService.ts'

import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { refractive } from "@hashintel/refractive"

const faqData = [
  {
    id: 1,
    header: "Czy aplikacja jest darmowa?",
    answer: `Tak, apliajca jest w pełni darmowa; nie wymaga żadnych opłat.`
  },
  {
    id: 2,
    header: "Czy aplikacja wymaga dostępu do internetu?",
    answer: `Aplikacja działa zarówno z dostępem do internetu jak i bez niego. W trybie offline nie są dotępne inforacje live tj. pozycje pojazdów w czasie rzeczywistym czy tabliczki rozkładów.`
  },
  {
    id: 3,
    header: "Jakie miasta są obsługiwane?",
    answer: `Niestety na razie aplikacja obsługuje tylko miasto Łódź. Prowadzone są działania ku zwiększeniu liczby obsługiwanych miast.`
  },
  {
    id: 4,
    header: "Czy wymagane jest posiadanie konta?",
    answer: `Tak, wymagane jest posiadanie konta.`
  },
  {
    id: 5,
    header: "Jakie są ograniczenia?",
    answer: `Aplikacja nie posiada żadnych limitów czy ograniczeń czasowych działania.`
  },
  {
    id: 6,
    header: "W jaki sposób zainstalować aplikacje?",
    answer: `Z serwisu można korzystać zarówno online - przez stronę internetową lub instalując ją na urządzeniu mobilnym. Pełny przewodnik instalacji znajduje się pod adresem: https://autobusy.web.app/instalaja`
  },
  {
    id: 7,
    header: "Co zrobić, gdy pojazd nie wyświetla się na mapie?",
    answer: `Czasami z przyczyn technicznych (np. awaria nadajnika GPS w starym modelu tramwaju lub brak zasięgu) pojazd może tymczasowo nie wysyłać swojej pozycji. W takim przypadku aplikacja wyświetla czas odjazdu na podstawie standardowego, teoretycznego rozkładu jazdy.`
  },
  {
    id: 8,
    header: "Jak działa śledzenie autobusów na żywo?",
    answer: `Pojazdy komunikacji miejskiej wyposażone są w nadajniki GPS, które co kilkanaście sekund wysyłają swoją pozycję do centralnego systemu. Nasza aplikacja przetwarza te dane i nanosi aktualne pozycje pojazdów na mapę, dzięki czemu wiesz, czy Twój transport spóźni się z powodu korków.`
  },
]

export default function App() {
  const { userLoggedIn, user } = useAuth()

  const [faqList, setFaqList] = useState<number[]>([])
  const [menu, setMenu] = useState<boolean>(false)

  if (user) {
    return <Navigate to="/app" />
  }

  return (
  <div className="bg-bg-1">
    {menu && <div className="fixed right-6 top-18 w-56 bg-neutral-900/95 backdrop-blur-md text-white rounded-xl border-2 border-neutral-700/50 shadow-2xl z-2000 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
      
      {/* NAGŁÓWEK DROPDOWNU Z ZAMKNIĘCIEM */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800 bg-neutral-950/40">
        <div className="flex items-center gap-2">
          <User size="sm" className="text-neutral-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">Konto</span>
        </div>
        <button 
          onClick={() => setMenu(false)}
          className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Zamknij"
        >
          <X size="sm" />
        </button>
      </div>

      <div className="p-1.5 flex flex-col gap-1">
        <Link to="/app"
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 active:bg-white/5 transition-colors cursor-pointer group text-left"
        >
          <Window size="sm" className="text-blue-400 group-hover:scale-105 transition-transform" />
          <span>Przejdź do aplikacji</span>
        </Link>

        <div className="h-px bg-neutral-800 my-1 mx-1.5"></div>

        <button
          onClick={() => {
            doSignOut()
            setMenu(false)
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-red-500/20 active:bg-red-500/10 text-red-400 transition-colors cursor-pointer group text-left"
        >
          <ArrowOutRightSquareHalf size="sm" className="group-hover:translate-x-0.5 transition-transform" />
          <span>Wyloguj się</span>
        </button>

      </div>
    </div>}

    <refractive.header
      refraction={{
          radius: 12,
          blur: 4,
          bezelWidth: 40,
          glassThickness: 5
        }}
      className="fixed w-full z-1000 top-0 px-6 py-4 flex justify-between items-center border-b-2 border-b-neutral-300 drop-shadow-xl bg-bg-1/70"
    >
      <Link to="/">
        <img src={logo} alt="" />
      </Link>

      {userLoggedIn ? (
        <Link to="/" onClick={() => setMenu(prev => !prev)}>
          <img src={user.photoURL} className="w-11 rounded-full cursor-pointer border-3 border-primaty-900" />
        </Link>
      ) : (
        <Link to="/logowanie" className="bg-primaty-900 text-white px-3 py-1.5 rounded-md cursor-pointer hover:-translate-y-0.5 transition-transform border-2 border-primaty-900 active:border-bg-1 active:ring-red-900">
          Zaloguj się
        </Link>
      )}
    </refractive.header>
    <main className="px-6 mt-25 max-w-7xl relative left-[50%] translate-x-[-50%] pb-12">
      <section className="grid md:grid-cols-2 justify-center gap-15 sm:gap-2 mb-10">
        <div className="flex flex-col gap-6 items-center md:items-start">
          <h1 className="title max-w-90">Twoje Miasto. Zawsze na Czas.</h1>
          <p className="text max-w-110">UrbanTransit to kompletne narzędzie do poruszania się po mieście. W jednej aplikacji sprawdzisz aktualną pozycję autobusów i tramwajów, sprawdzisz bieżący rozkład jazdy i zaplanujesz optymalną trasę na podstawie bieżących danych o ruchu.</p>

          <div className="flex flex-col gap-4">
            <Link to={userLoggedIn ? "/app" : "/logowanie"} >
              <button className="btn-full">
                {userLoggedIn ? "Przejdź do aplikacji" : "Zaloguj się"}
              </button>
            </Link>
            {/* <button className="btn-alt">
              Sprawdź rozkład
            </button> */}
          </div>
        </div>
        <img src={hero} alt="" className="ml-auto" />
      </section>
      
      <section className="mb-22">
        <h2 className="title mb-5">Podróżuj bez ograniczeń</h2>
        <p className="text">Zaprojektowaliśmy UrbanTransit, aby rozwiązać Twoje największe problemy komunikacyjne.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="card">
            <div className="flex justify-center items-center p-2.5 bg-[#E7E8EA] rounded-md">
              <Stopwatch />
            </div>
            <h3 className="text-xl font-bold">Dane na żywo</h3>
            <p className="card-text">Lokalizacja GPS aktualizowana z minimalnym opóźnieniem. Widzisz dokładny czas przyjazdu swojego autobusu lub tramwaju.</p>
          </div>  

          <div className="card">
            <div className="flex justify-center items-center p-2.5 bg-[#E2FEF1] rounded-md">
              <Star fill="#006C49" />
            </div>
            <h3 className="text-xl font-bold">Ulubione linie i przystanki</h3>
            <p className="card-text">Zapisuj trasy, z których korzystasz najczęściej. Masz do nich szybki dostęp od razu po otwarciu aplikacji.</p>
          </div>  

          <div className="card">
            <div className="flex justify-center items-center p-2.5 bg-[#F6F6FF] rounded-md">
              <MapIcon fill="#2F2EBE" />
            </div>
            <h3 className="text-xl font-bold">Mapy offline</h3>
            <p className="card-text">Brak internetu? Żaden problem. Pobierz mapy i rozkłady jazdy, aby mieć do nich dostęp w każdej chwili.</p>
          </div>    

          <div className="card">
            <div className="flex justify-center items-center p-2.5 bg-[#FFF4F3] rounded-md">
              <BellRing fill="#BA1A1A"/>
            </div>
            <h3 className="text-xl font-bold">Powiadomienia o utrudnieniach</h3>
            <p className="card-text">Dowiaduj się na bieżąco o korkach, objazdach i nagłych zmianach na swoich trasach.</p>
          </div>    
        </div>
      </section>

      <section className="mb-22">
        <h2 className="title text-center">Często zadawane pytania</h2>
        <div className="mt-8 grid grid-cols-1 gap-5">
          {faqData.map(item => {
            const showAns = faqList.includes(item.id)

            return (
              <div
                key={item.id}
                onClick={() => setFaqList((prev) => showAns ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                className="faq-card cursor-pointer overflow-hidden"
              > 
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{item.header}</h3>
                  <ChevronDown size="md" className={clsx(showAns && "rotate-180", "transition-transform")} />
                </div>

                <div className={clsx(
                  "grid transition-[grid-template-rows]",
                  showAns ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}>
                  {/* wewnętrzny div z overflow-hidden trzymający treść */}
                  <div className="overflow-hidden">
                    <div className="text pl-5 pt-2">
                      <p className="text-justify wrap-break-word pb-6">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-[#EFF4FF] mb-22 rounded-xl px-8 py-12 overflow-hidden shadow-md">
        <h1 className="title text-center">Jak to działa?</h1>
        <div className="h-0.5 hidden md:flex relative w-[75%] left-[50%] translate-x-[-50%] bg-neutral-200 top-21 z-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 mt-12 gap-18 md:gap-12 relative z-100">
          <div className="hiw-card">
            <div>1</div>
            <h4>Wyszukaj</h4>
            <p className="text">Sprawdź pozycję pojazdu na mapie lub wyszukaj przystanek, by od razu zobaczyć tablicę odjazdów w czasie rzeczywistym.</p>
          </div>
          <div className="hiw-card">
            <div>2</div>
            <h4>śledź</h4>
            <p className="text">Kliknij ikonkę pojazdu, aby wyświetlić całą jego trasę wraz z przystankami, kolejne odjazdy oraz informacje na jego temat.</p>
          </div>
          <div className="hiw-card">
            <div>3</div>
            <h4>Ruszaj w drogę</h4>
            <p className="text">Jedź spokojnie i bez jakichkolwiek obaw.</p>
          </div>
        </div>
      </section>

      <section className="mb-10 bg-primaty-900 px-16 py-8 rounded-xl flex flex-col items-center gap-5 shadow-xl">
        <h2 className="title text-white text-center">Gotowy na lepszą podróż?</h2>
        <p className="text text-lg text-bg-1 text-center">Dołącz do społeczności, która codziennie oszczędza czas dzięki UrbanTransit.</p>
        <Link to={userLoggedIn ? "/app" : "/logowanie"} >
          <button className="btn-full bg-white text-primaty-900 font-black mt-4 active:border-primaty-900">
            {userLoggedIn ? "Przejdź do aplikacji" : "Zaloguj się"}
          </button>
        </Link>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style= {{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px"}}></div>
      </section>
    </main>

    <footer className="px-6 bg-white border-t-2 border-t-neutral-300 py-4 font-mono uppercase font-bold">
      <Link to="/">
        <img src={logo} className="w-50" alt="" />
      </Link>
      <div className="flex flex-col items-center md:flex-row md:justify-between mt-8 gap-1">
        <Link
          to="polityka-prywatnosci"
          className="text-blue-500 hover:underline"
        >
          polityka-prywatnosci
        </Link>
        <p className="text-center">© 2026 Szymon Piera. Wszelkie prawa zastrzeżone.</p>
      </div>
    </footer>
  </div>)
}