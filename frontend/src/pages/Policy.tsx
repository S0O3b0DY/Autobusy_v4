// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserCheck, Key, Database, Location, HardDrive } from '@boxicons/react'

import Header from '../components/Header'
import Footer from '../components/Footer'
import AppCTA from '../components/AppCTA'
import { Helmet } from 'react-helmet'

export default function Policy() {
  const navigate = useNavigate()
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
        <title>Polityka Prywatności - UrbanTransit</title>
      </Helmet>

      <AppCTA />
      <Header />

      <main className="mb-22 pt-28 max-w-4xl px-5 relative left-[50%] -translate-x-[50%]">
        
        {/* POWRÓT & BADGE */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 fill-current" />
            Wróć
          </button>
        </div>

        {/* NAGŁÓWEK HERO */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-3">
            Polityka Prywatności
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-mono">
            Ostatnia aktualizacja: 2026 r. • Administrator Danych: Szymon Piera
          </p>
        </header>

        {/* ZAWARTOŚĆ POLITYKI */}
        <div className="space-y-8 text-neutral-700 text-sm sm:text-base leading-relaxed">
          
          {/* 1. INFORMACJE OGÓLNE */}
          <section className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">1. Informacje ogólne</h2>
            </div>
            <p className="text-neutral-600">
              Niniejsza Polityka Prywatności określa zasady przetwarzania, przechowywania i ochrony danych użytkowników korzystających z aplikacji i serwisu internetowego (dalej jako "Aplikacja"). Administratorem Danych Osobowych jest <strong className="text-neutral-900 font-semibold">Szymon Piera</strong>.
            </p>
          </section>

          {/* 2. LOGOWANIE OAUTH & PRZECHOWYWANE DANE */}
          <section className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">2. Logowanie OAuth i zakres danych</h2>
            </div>
            <p className="mb-4 text-neutral-600">
              Aplikacja umożliwia bezpieczne uwierzytelnianie za pomocą dostawców tożsamości (Protokół OAuth): <strong>Google, Facebook, Microsoft oraz GitHub</strong>, obsługiwanych przez platformę <strong>Firebase Authentication</strong>.
            </p>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4">
              <h3 className="text-xs font-mono uppercase text-neutral-500 font-bold mb-3 flex items-center gap-1.5">
                <Database className="w-4 h-4 fill-current" /> Zapisywane w bazie Firebase:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-neutral-700">
                <li className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Unikalny identyfikator (<code className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-neutral-900">UUID</code>)</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Adres e-mail</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Nazwa użytkownika (z profilu)</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Link do avatara</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200 col-span-1 sm:col-span-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Data założenia konta oraz data ostatniego logowania</span>
                </li>
              </ul>
            </div>

            <p className="text-neutral-600 text-sm">
              Na koncie zalogowanego użytkownika synchronizujemy również ustawienia personalizacji: <strong>identyfikatory ulubionych przystanków oraz numerów linii</strong>.
            </p>
          </section>

          {/* 3. BRAK GEOLOKALIZACJI */}
          <section className="bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shrink-0">
                <Location className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-emerald-950">3. Dane geolokalizacyjne (GPS)</h2>
            </div>
            <p className="text-emerald-900/90 text-sm sm:text-base">
              Aplikacja <strong>nie zbiera, nie przetwarza ani nie przechowuje</strong> dokładnych danych lokalizacyjnych (GPS) Twojego urządzenia. Prezentacja pozycji pojazdów oraz rozkładów odbywa się bez śledzenia położenia fizycznego użytkownika.
            </p>
          </section>

          {/* 4. LOCALSTORAGE I FIREBASE */}
          <section className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">4. Przechowywanie danych na urządzeniu</h2>
            </div>
            <div className="space-y-3 text-neutral-600">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <strong className="text-neutral-900 font-bold block mb-1">LocalStorage</strong>
                Używany do lokalnego zachowania preferencji interfejsu (np. wybrany język oraz motyw jasny/ciemny).
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <strong className="text-neutral-900 font-bold block mb-1">Firebase SDK</strong>
                Przechowuje bezpieczne tokeny sesyjne, zapobiegając konieczności ponownego logowania przy każdym otwarciu Aplikacji.
              </div>
            </div>
          </section>

          {/* 5. GOOGLE ADSENSE */}
          {/* <section className="bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">5. Usługi reklamowe (Google AdSense)</h2>
            </div>
            <p className="text-neutral-600 mb-3">
              W Aplikacji wyświetlane są reklamy sieci Google AdSense, które wykorzystują pliki cookie w celu dopasowania treści do Twoich zainteresowań.
            </p>
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold font-mono text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl transition-colors"
            >
              Ustawienia reklam Google
              <Link className="w-3.5 h-3.5 fill-current" />
            </a>
          </section> */}

          {/* 6. RODO & KONTAKT */}
          <section className="bg-neutral-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-lg">
              <span className="text-xs font-mono uppercase text-neutral-400 font-bold block mb-1">
                6. Prawa użytkownika (RODO)
              </span>
              <h2 className="text-2xl font-bold mb-2">Usuwanie i modyfikacja danych</h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Masz prawo do wglądu, modyfikacji oraz żądania całkowitego usunięcia konta. Usunięcie profilu skutkuje bezpowrotnym skasowaniem Twoich danych z bazy Firebase. Aby tego dokonać należy wypełnić formularz kontaktowy.
              </p>
            </div>
            {/* 
            <div className="w-full md:w-auto flex flex-col items-center gap-2">
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

        </div>

      </main>

      <Footer />
    </>
  )
}