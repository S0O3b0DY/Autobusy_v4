// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { Link } from "react-router-dom"

// --- DANE ---
const trams: string[] = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10A", "10B", "11", "12", "14", 
  "15", "16", "17", "18", "41", "43", "45", "O", "P1", "P2", "R8", "Z1"
];

const buses: string[] = [
  "6", "50A", "50B", "51A", "51B", "52", "53A", "53B", "53C", "54A", "54B", 
  "55A", "55B", "56", "57", "58A", "58B", "59", "60A", "60B", "60C", "60D", 
  "61", "62", "63", "64A", "64B", "65A", "65B", "66", "67", "68", "69A", "69B", 
  "70", "71A", "71B", "72A", "72B", "73", "75A", "75B", "76", "77", "78", 
  "80A", "80B", "81A", "81B", "82A", "82B", "83", "84A", "84B", "85A", "85B", 
  "86", "87A", "87B", "88A", "88B", "88C", "88D", "89", "90", "91A", "91B", 
  "91C", "92A", "92B", "93", "94", "96", "97A", "97B", "99", "100", "101", 
  "201", "202", "oP6", "F1", "G1", "G2", "H", "N1A", "N1B", "N2", "N3A", 
  "N3B", "N4A", "N4B", "N5A", "N5B", "N6", "N7A", "N7B", "N8", "N9", "P4", 
  "P7", "R11", "R16", "R22", "R24", "R26", "R9", "W", "Z13", "Z3", "Z6"
];

const descTrams: string[] = [
  "Główne połączenie szynowe. Kliknij, aby sprawdzić rozkład jazdy, listę przystanków oraz pozycję tramwaju na żywo.",
  "Linia obsługująca ważne węzły przesiadkowe. Zobacz trasę przejazdu na interaktywnej mapie z danymi GPS.",
  "Zapewnia szybki transport między dzielnicami omijając korki. Śledź opóźnienia i sprawdzaj kolejne odjazdy."
];

const descBuses: string[] = [
  "Popularna trasa autobusowa łącząca osiedla z centrum miasta. Kliknij, aby zobaczyć trasę oraz nadajniki GPS.",
  "Zapewnia dojazd do najważniejszych punktów usługowych i szkół. Śledź pojazd w czasie rzeczywistym.",
  "Uzupełnia sieć tramwajową. Sprawdź na mapie aktualne opóźnienia i rozkład jazdy dla tego połączenia.",
  "Linia dowożąca pasażerów do stacji przesiadkowych. Zobacz tabliczkę przystankową i kolejne odjazdy."
];

// --- HELPER DO KOLORÓW AUTOBUSÓW ---
interface BusStyle {
  bgColor: string;
  hoverColor: string;
  borderHover: string;
  typeName: string;
}

const getBusStyle = (bus: string): BusStyle => {
  if (bus.startsWith("N")) {
    return {
      bgColor: "bg-gray-800",
      hoverColor: "group-hover:bg-gray-900",
      borderHover: "hover:border-gray-400",
      typeName: "Nocny",
    };
  }
  if (bus.startsWith("Z")) {
    return {
      bgColor: "bg-yellow-500",
      hoverColor: "group-hover:bg-yellow-600",
      borderHover: "hover:border-yellow-400",
      typeName: "Zastępcza",
    };
  }
  return {
    bgColor: "bg-cyan-600",
    hoverColor: "group-hover:bg-cyan-700",
    borderHover: "hover:border-cyan-300",
    typeName: "Autobus",
  };
};

export default function LinesDesc() {
  return <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        
        {/* SEKCJA SEO DLA ROBOTA ADSENSE */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Wykaz Linii Komunikacji Miejskiej
          </h1>
          <p className="text-gray-600 leading-relaxed mb-4">
            Witaj w oficjalnym spisie linii autobusowych i tramwajowych. Znajdziesz tutaj kompletne zestawienie wszystkich dostępnych połączeń w naszym mieście. System komunikacji miejskiej dzieli się na szybkie linie tramwajowe, które stanowią główny trzon transportowy, oraz rozbudowaną sieć linii autobusowych docierających do każdego osiedla, stref podmiejskich oraz kluczowych węzłów przesiadkowych.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Wybierz interesujący Cię numer linii z poniższej listy, aby przejść do szczegółów. Możesz sprawdzić aktualne rozkłady jazdy dla każdego dnia tygodnia, zapoznać się z pełną listą przystanków na trasie oraz co najważniejsze – <strong>śledzić dokładną pozycję wybranego pojazdu na interaktywnej mapie GPS w czasie rzeczywistym</strong>. Dzięki temu unikniesz czekania na spóźniony transport!
          </p>
        </div>

        {/* TRAMWAJE */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V3zm2-1a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1H6zm1 12h6v2H7v-2zm-1 3h8v1H6v-1z" />
          </svg>
          Linie Tramwajowe
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {trams.map((tram, index) => (
            /* Zmień <a> na <Link href={`/linia/${tram}`}> jeśli używasz Next.js */
            <Link
              key={`tram-${tram}`}
              to="/"
              className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-red-300 transition-all group"
            >
              <div className="flex items-center mb-3">
                <span className="bg-red-600 text-white text-lg font-bold px-3 py-1 rounded-md shadow-sm group-hover:bg-red-700">
                  {tram}
                </span>
                <span className="ml-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Tramwaj
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">
                {descTrams[index % descTrams.length]}
              </p>
            </Link>
          ))}
        </div>

        {/* AUTOBUSY */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V3zm2-1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1H6zm1 14h6v1H7v-1zM5 4h10v6H5V4zm1 1h8v4H6V5z" />
          </svg>
          Linie Autobusowe
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {buses.map((bus, index) => {
            const { bgColor, hoverColor, borderHover, typeName } = getBusStyle(bus);

            return (
              /* Zmień <a> na <Link href={`/linia/${bus}`}> jeśli używasz Next.js */
              <Link
                key={`bus-${bus}`}
                to="/"
                className={`block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all group ${borderHover}`}
              >
                <div className="flex items-center mb-3">
                  <span className={`${bgColor} text-white text-lg font-bold px-3 py-1 rounded-md shadow-sm ${hoverColor}`}>
                    {bus}
                  </span>
                  <span className="ml-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {typeName}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {descBuses[index % descBuses.length]}
                </p>
              </Link>
            );
          })}
        </div>
        
        {/* POWRÓT */}
        <div className="pt-6 border-t border-gray-200 text-center">
          {/* Zmień <a> na <Link href="/"> jeśli używasz Next.js */}
          <Link to="/" className="text-sm font-semibold text-cyan-600 hover:text-cyan-500 transition-colors">
            &larr; Powrót do mapy głównej
          </Link>
        </div>

      </div>
    </div>
}