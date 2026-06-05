// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { Link } from "react-router-dom"

export default function Policy() {
  return <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
  <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
    
    <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Polityka Prywatności</h1>
    <p className="text-sm text-gray-500 mb-8">Ostatnia aktualizacja: 2026 r.</p>

    <div className="space-y-6 text-base leading-relaxed text-gray-600">
      
      <section>
        <h2 className="text-xl font-bold text-gray-950 mb-3">1. Informacje ogólne</h2>
        <p>
          Niniejsza Polityka Prywatności określa zasady przetwarzama, przechowywania i ochrony danych użytkowników korzystających z aplikacji i serwisu internetowego (dalej jako "Aplikacja"). Administratorem Danych Osobowych jest <span className="text-gray-900 font-medium">Szymon Piera</span>, kontaktowy adres e-mail: <span className="text-cyan-600 font-medium">szymon.pira@gmail.com</span>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-950 mb-3">2. Logowanie OAuth i zakres zbieranych danych</h2>
        <p className="mb-3">
          Aplikacja umożliwia bezpieczne uwierzytelnianie i utworzenie konta za pomocą zewnętrznych dostawców tożsamości (Protokół OAuth): <strong>Google, Facebook, Microsoft oraz GitHub</strong>. Usługa ta jest realizowana za pośrednictwem platformy <strong>Firebase Authentication</strong>.
        </p>
        <p className="mb-3">W przypadku logowania przez OAuth, w naszej bazie danych zapisujemy następujące informacje:</p>
        <ul className="list-disc list-inside pl-2 space-y-1 mb-3">
          <li>Unikalny identyfikator użytkownika generowany przez system (<span className="text-gray-900 font-mono text-sm">UUID</span>),</li>
          <li>Adres e-mail,</li>
          <li>Nazwa użytkownika pobrana od dostawcy (Providera),</li>
          <li>Link do avatara (zdjęcia profilowego),</li>
          <li>Data założenia konta oraz data ostatniego logowania.</li>
        </ul>
        <p>
          Dodatkowo, w celu świadczenia głównej funkcjonalności aplikacji, na koncie zalogowanego użytkownika przechowujemy spersonalizowane dane konfiguracyjne: <strong>identyfikatory (ID) ulubionych przystanków oraz numery ulubionych linii komunikacyjnych</strong>. Dane te służą wyłącznie synchronizacji Twoich ustawień między urządzeniami.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-950 mb-3">3. Dane geolokalizacyjne (GPS)</h2>
        <p>
          Aplikacja <strong>nie zbiera, nie przetwarza ani nie przechowuje</strong> dokładnych danych lokalizacyjnych (GPS) Twojego urządzenia. Wyświetlanie pozycji pojazdów komunikacji miejskiej oraz wyszukiwanie połączeń odbywa się bez śledzenia fizycznego położenia użytkownika.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-950 mb-3">4. Przechowywanie danych na urządzeniu (LocalStorage i Firebase)</h2>
        <p className="mb-2">Aplikacja wykorzystuje pamięć podręczną urządzenia użytkownika w celach technicznych:</p>
        <ul className="list-disc list-inside pl-2 space-y-1">
          <li><strong>LocalStorage:</strong> Służy do lokalnego zapamiętania preferencji interfejsu, takich jak wybrany język aplikacji oraz motyw graficzny (np. tryb jasny/ciemny).</li>
          <li><strong>Firebase SDK:</strong> Zewnętrzne skrypty platformy Firebase zarządzają tokenami sesyjnymi, co pozwala na bezpieczne utrzymanie zalogowania użytkownika bez konieczności wpisywania danych przy każdym uruchomieniu aplikacji.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-950 mb-3">5. Usługi reklamowe (Google AdSense)</h2>
        <p className="mb-2">
          W aplikacji wyświetlane są reklamy dostarczane przez sieć Google AdSense. 
        </p>
        <ul className="list-disc list-inside pl-2 space-y-1">
          <li>Google oraz dostawcy zewnętrzni używają plików cookie do wyświetlania reklam na podstawie Twoich wcześniejszych odwiedzin w tej lub innych witrynach internetowych.</li>
          <li>Mechanizm ten pozwala na dobieranie reklam spersonalizowanych, dopasowanych do potencjalnych zainteresowań użytkownika.</li>
          <li>Zarządzanie preferencjami reklam oraz całkowita rezygnacja z personalizacji jest możliwa w każdej chwili na stronie <a href="https://adssettings.google.com" target="_blank" className="text-cyan-600 underline hover:text-cyan-500">Ustawień reklam Google</a>.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-950 mb-3">6. Okres przechowywania i usuwanie danych (RODO)</h2>
        <p className="mb-2">
          Dane profilowe oraz zapisane ulubione linie/przystanki są przechowywane przez okres aktywności konta użytkownika. 
        </p>
        <p>
          Każdemu użytkownikowi przysługuje prawo do wglądu w swoje dane, ich modyfikacji oraz żądania całkowitego zaprzestania ich przetwarzania. Usunięcie konta skutkuje bezpowrotnym skasowaniem wszystkich zebranych danych z bazy Firebase. W celu realizacji swoich praw lub w przypadku pytań, prosimy o kontakt pod adresem: <span className="text-cyan-600 font-medium">szymon.pira@gmail.com</span>.
        </p>
      </section>

    </div>
    
    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
      <Link to="/" className="text-sm font-semibold text-cyan-600 hover:text-cyan-500 transition-colors">
        &larr; Powrót do mapy głównej
      </Link>
    </div>
  </div>
</div>
}