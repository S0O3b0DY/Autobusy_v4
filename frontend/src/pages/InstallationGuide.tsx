// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useState } from 'react'
import { Phone, DotsVertical, Home, Check, InfoCircle, Share, Link, Globe } from '@boxicons/react'

import Header from '../components/Header'
import Footer from '../components/Footer'
import AppCTA from '../components/AppCTA'
import { Helmet } from 'react-helmet'

type OS = 'android' | 'ios'

export default function InstallationGuide() {
  const [activeOS, setActiveOS] = useState<OS>('android')
  const [copiedLink, setCopiedLink] = useState(false)

  const currentUrl = window.location.origin

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Błąd kopiowania linku')
    }
  }

  return (
    <>
      <Helmet>
        <title>Jak zainstalować? - UrbanTransit</title>
      </Helmet>
      <AppCTA />
      <Header />

      <main className="mb-22 pt-30 max-w-4xl px-5 relative left-[50%] -translate-x-[50%]">

        {/* NAGŁÓWEK */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-4">
            Jak zainstalować aplikację na telefonie?
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">
            Dodaj serwis do ekranu głównego w przeglądarce <strong>Google Chrome</strong>. Dzięki temu zyskasz szybki dostęp do rozkładów i komunikatów jednym kliknięciem – dokładnie tak, jak w tradycyjnej aplikacji!
          </p>
        </header>

        {/* SELEKTOR SYSTEMU OPERACYJNEGO */}
        <div className="flex bg-neutral-100 p-1.5 rounded-2xl border-2 border-neutral-300 mb-10 max-w-md">
          <button
            onClick={() => setActiveOS('android')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeOS === 'android'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Phone className="w-4 h-4 fill-current" />
            Android (Chrome)
          </button>

          <button
            onClick={() => setActiveOS('ios')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeOS === 'ios'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Phone className="w-4 h-4 fill-current" />
            iOS / iPhone (Chrome)
          </button>
        </div>

        {/* INSTRUKCJA DLA ANDROIDA */}
        {activeOS === 'android' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-900 text-sm">
              <InfoCircle className="w-5 h-5 fill-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Wymagania:</strong>
                Upewnij się, że otworyłeś ten portal bezpośrednio w przeglądarce <strong>Google Chrome</strong> na telefonie.
              </div>
            </div>

            <ol className="space-y-4">
              <li className="bg-white border-2 border-neutral-300 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-neutral-900 mb-1">Otwórz menu przeglądarki Chrome</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                    Kliknij ikonę <strong>trzech pionowych kropek</strong> w prawym górnym rogu ekranu przeglądarki.
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-lg text-xs font-mono font-bold text-neutral-700 border border-neutral-200">
                    <DotsVertical className="w-4 h-4 fill-current" /> Ikona menu (3 kropki)
                  </span>
                </div>
              </li>

              <li className="bg-white border-2 border-neutral-300 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-neutral-900 mb-1">Wybierz opcję instalacji / skrótu</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                    Z rozwijanej listy wybierz opcję <strong>„Zainstaluj aplikację”</strong> lub <strong>„Dodaj do ekranu głównego”</strong>.
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-lg text-xs font-mono font-bold text-neutral-700 border border-neutral-200">
                    <Home className="w-4 h-4 fill-current" /> Dodaj do ekranu głównego
                  </span>
                </div>
              </li>

              <li className="bg-white border-2 border-neutral-300 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-neutral-900 mb-1">Zatwierdź operację</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Potwierdź nazwę skrótu i kliknij przycisk <strong>„Dodaj”</strong> lub <strong>„Zainstaluj”</strong> w okienku pop-up. Gotowe! Ikona aplikacji pojawi się na pulpicie Twojego telefonu.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* INSTRUKCJA DLA IOS / IPHONE */}
        {activeOS === 'ios' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-blue-900 text-sm">
              <InfoCircle className="w-5 h-5 fill-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Wskazówka dotycząca systemów Apple:</strong>
                Przeglądarka Chrome na iOS pozwala dodawać skróty do ekranu głównego (wymagany iOS 16.4 lub nowszy). Alternatywnie możesz użyć fabrycznej przeglądarki Safari.
              </div>
            </div>

            <ol className="space-y-4">
              <li className="bg-white border-2 border-neutral-300 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-neutral-900 mb-1">Kliknij przycisk „Udostępnij” w Chrome</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                    W prawym górnym rogu paska adresu Chrome kliknij ikonę <strong>Udostępnij</strong> (kwadrat ze strzałką skierowaną w górę).
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-lg text-xs font-mono font-bold text-neutral-700 border border-neutral-200">
                    <Share className="w-4 h-4 fill-current" /> Ikona Udostępnij
                  </span>
                </div>
              </li>

              <li className="bg-white border-2 border-neutral-300 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-neutral-900 mb-1">Przewiń w dół i znajdź skrót</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                    Na liście systemowej przesuń palcem w dół i wybierz pozycję <strong>„Dodaj do ekranu początkowego”</strong>.
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-lg text-xs font-mono font-bold text-neutral-700 border border-neutral-200">
                    <Home className="w-4 h-4 fill-current" /> Dodaj do ekranu początkowego
                  </span>
                </div>
              </li>

              <li className="bg-white border-2 border-neutral-300 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-neutral-900 mb-1">Potwierdź dodanie skrótu</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Stuknij <strong>„Dodaj”</strong> w prawym górnym rogu. Dedykowana ikona pojawi się na Twoim ekranie początkowym.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* SEKCJA POMOCNICZA: KOPIOWANIE LINKU & DLACZEGO WARTO */}
        <div className="mt-12 pt-10 border-t-2 border-neutral-200 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-7 bg-neutral-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-neutral-400 font-bold mb-3">
                <Globe size="xs" /> Szybki link
              </div>
              <h3 className="text-xl font-bold mb-2">Czytasz to na komputerze?</h3>
              <p className="text-sm text-neutral-300 leading-relaxed mb-6">
                Skopiuj odnośnik i prześlij go na swój telefon, aby szybko otworzyć stronę w przeglądarce Chrome.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-neutral-800 p-2 rounded-xl border border-neutral-700">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="bg-transparent text-xs font-mono text-neutral-300 px-2 flex-1 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-white text-neutral-900 text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 fill-emerald-600" /> : <Link className="w-4 h-4 fill-current" />}
                {copiedLink ? 'Skopiowano!' : 'Kopiuj URL'}
              </button>
            </div>
          </div>

          <div className="md:col-span-5 bg-white border-2 border-neutral-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 mb-3">Dlaczego warto?</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</span>
                  Brak konieczności pobierania ciężkich plików z Google Play / App Store.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</span>
                  Brak paska adresu przeglądarki – strona działa w pełnym ekranie.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</span>
                  Zawsze aktualne dane bez potrzeby ręcznej aktualizacji aplikacji.
                </li>
              </ul>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </>
  )
}