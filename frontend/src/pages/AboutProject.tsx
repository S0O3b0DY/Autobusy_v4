// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// import { useState } from 'react'
import { Phone, Database, ShieldAlt, Copy, Heart,
  // Thunder,
} from '@boxicons/react'

import Header from '../components/Header'
import Footer from '../components/Footer'
import AppCTA from '../components/AppCTA'
import { Helmet } from "react-helmet"

export default function AboutPage() {
  // const [copiedEmail, setCopiedEmail] = useState(false)
  // const contactEmail = 'szymon.pira@gmail.com'

  // const handleCopyEmail = async () => {
  //   try {
  //     await navigator.clipboard.writeText(contactEmail)
  //     setCopiedEmail(true)
  //     setTimeout(() => setCopiedEmail(false), 2000)
  //   } catch (err) {
  //     console.error('Błąd kopiowania adresu e-mail', err)
  //   }
  // }

  return (
    <> 
      <Helmet>
        <title>O projekcie - UrbanTransit</title>
      </Helmet>

      <AppCTA />
      <Header />

      <main className="mb-22 pt-30 max-w-4xl px-5 relative left-[50%] -translate-x-[50%]">
        {/* NAGŁÓWEK HERO */}
        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-4">
            Prosty, szybki i prywatny dostęp do komunikacji miejskiej.
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">
            UrbanTransit powstał z prostego powodu: aby pasażer mógł sprawdzić godzinę odjazdu swojego autobusu lub tramwaju bez przechodzenia przez skomplikowane menu, zbędne ekrany i przeładowane strony.
          </p>
        </header>

        {/* FILARY PROJEKTU - SIATKA KART */}
        <div className="space-y-6 mb-12">

          {/* SZYBKOŚĆ & PWA (DWA GŁÓWNE ATUTY) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. SZYBKOŚĆ (TEMAT 2 - bez utrudnień) */}
            {/* <div className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
                  <Thunder className="w-5 h-5 fill-current" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Informacja w mniej niż 2 sekundy</h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Otwierasz aplikację i natychmiast widzisz to, co najważniejsze – dokładne godziny odjazdów z Twojego przystanku. Bez zbędnego klikania, przeładowanych widoków czy szukania w głębokich strukturach menu.
                </p>
              </div>
            </div> */}

            {/* 2. TECHNOLOGIA PWA (TEMAT 8) */}
            <div className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-4">
                  <Phone className="w-5 h-5 fill-current" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Aplikacja bez pobierania ze sklepu</h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Dzięki technologii <strong>Progressive Web App (PWA)</strong> nie musisz pobierać setek megabajtów z App Store czy Google Play. Wystarczy, że dodasz stronę do ekranu głównego telefonu – działa błyskawicznie i nie wymaga ręcznych aktualizacji.
                </p>
              </div>
            </div>

          </div>

          {/* DANE REAL-TIME & PRYWATNOŚĆ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 3. DANE W CZASIE RZECZYWISTYM (TEMAT 6) */}
            <div className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mb-4">
                  <Database className="w-5 h-5 fill-current" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Oficjalne źródła i Open Data</h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Aplikacja bazuje na oficjalnych otwartych zbiorach danych miejskich (formaty <strong>GTFS oraz GTFS Real-Time</strong>). Dane o pozycjach pojazdów i szacowanych czasach przyjazdu pochodzą bezpośrednio z systemów transportowych przewoźników.
                </p>
              </div>
            </div>

            {/* 4. PRYWATNOŚĆ Z NATURY (TEMAT 7) */}
            <div className="bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mb-4">
                  <ShieldAlt className="w-5 h-5 fill-current" />
                </div>
                <h2 className="text-xl font-bold text-emerald-950 mb-2">Prywatność z natury</h2>
                <p className="text-sm text-emerald-900/90 leading-relaxed">
                  Szanujemy Twoją prywatność. Aplikacja nie śledzi ciągle Twojej pozycji GPS, nie tworzy profilu Twoich zachowań ani nie przekazuje danych podmiotom trzecim. Wyszukujesz przystanki bezpiecznie i bez pozostawiania cyfrowego śladu.
                </p>
              </div>
            </div>

          </div>

          {/* 5. SYNCHRONIZACJA URZĄDZEŃ (TEMAT 9) */}
          <div className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Copy className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-1">
                  Ulubione przystanki na każdym urządzeniu
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Zapisuj swoje najczęstsze trasy, linie i przystanki. Dzięki bezpiecznemu logowaniu (OAuth / Firebase) Twoje spersonalizowane ustawienia synchronizują się automatycznie pomiędzy smartfonem, tabletem a komputerem.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* 6. SPOŁECZNOŚĆ & ZAANGAŻOWANIE (TEMAT 12) */}
        <section className="bg-neutral-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-neutral-400 font-bold mb-2">
              <Heart size="xs" /> Inicjatywa społecznościowa
            </div>
            <h2 className="text-2xl font-bold mb-2">Tworzony razem z pasażerami</h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Ten portal rozwija się dzięki osobom, które korzystają z niego na co dzień. Jeśli masz pomysł na nową funkcję, chcesz zaproponować usprawnienie interfejsu lub zauważyłeś błąd? Wypełnij formularz.
            </p>
          </div>

          {/* <div className="w-full md:w-auto flex flex-col items-center gap-2">
            <div className="w-full sm:w-auto px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-mono text-neutral-300 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Envelope className="w-4 h-4 fill-neutral-400" />
                {contactEmail}
              </span>
              <button
                onClick={handleCopyEmail}
                className="px-3 py-1.5 bg-white text-neutral-900 font-sans font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 fill-emerald-600" /> : <Link className="w-3.5 h-3.5 fill-current" />}
                {copiedEmail ? 'Skopiowano' : 'Kopiuj'}
              </button>
            </div>
          </div> */}
        </section>

      </main>

      <Footer />
    </>
  )
}