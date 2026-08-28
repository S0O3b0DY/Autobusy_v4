// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { refractive } from "@hashintel/refractive"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import logo from "/assets/logo.svg"
import { useEffect, useState } from "react"
import { User, X, Menu, Window, ArrowOutLeftSquareHalf } from "@boxicons/react"
import { doSignOut } from './../lib/authService.ts'

const NAV_LINKS = [
  { to: "/", label: "Strona główna" },
  { to: "/blog", label: "Blog" },
  { to: "/jak-zainstalowac", label: "Jak zainstalować?" },
  { to: "/o-projekcie", label: "O projekcie" },
  { to: "/kontakt", label: "Kontakt" },
]

export default function Header() {
  const { userLoggedIn, user } = useAuth()
  const [accountMenuOpen, setAccountMenuOpen] = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  const anyMenuOpen = accountMenuOpen || mobileMenuOpen
  const closeMenus = () => {
    setAccountMenuOpen(false)
    setMobileMenuOpen(false)
  }

  const toggleAccountMenu = () => {
    setMobileMenuOpen(false)
    setAccountMenuOpen((prev) => !prev)
  }

  const toggleMobileMenu = () => {
    setAccountMenuOpen(false)
    setMobileMenuOpen((prev) => !prev)
  }

  // Zamykanie klawiszem Escape — standardowe oczekiwanie przy dropdownach/panelach
  useEffect(() => {
    if (!anyMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenus()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [anyMenuOpen])

  return (
    <>
      {anyMenuOpen && (
        <div
          className="fixed inset-0 z-900"
          onClick={closeMenus}
          aria-hidden="true"
        />
      )}

      {/* DROPDOWN KONTA */}
      {accountMenuOpen && (
        <div
          role="menu"
          className="fixed right-4 sm:right-6 top-18 w-56 bg-neutral-900/95 backdrop-blur-md text-white rounded-xl border-2 border-neutral-700/50 shadow-2xl z-2000 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          {/* NAGŁÓWEK DROPDOWNU Z ZAMKNIĘCIEM */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800 bg-neutral-950/40">
            <div className="flex items-center gap-2">
              <User size="sm" className="text-neutral-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                Konto
              </span>
            </div>
            <button
              onClick={() => setAccountMenuOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Zamknij"
            >
              <X size="sm" />
            </button>
          </div>

          <div className="p-1.5 flex flex-col gap-1">
            <Link
              to="/app"
              role="menuitem"
              target="_blank"
              onClick={() => setAccountMenuOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 active:bg-white/5 transition-colors cursor-pointer group text-left"
            >
              <Window size="xs" className="text-blue-400 group-hover:scale-105 transition-transform" />
              <span>Przejdź do aplikacji</span>
            </Link>

            <div className="h-px bg-neutral-800 my-1 mx-1.5"></div>

            <button
              role="menuitem"
              onClick={() => {
                doSignOut()
                setAccountMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-red-500/20 active:bg-red-500/10 text-red-400 transition-colors cursor-pointer group text-left"
            >
              <ArrowOutLeftSquareHalf size="xs" className="group-hover:translate-x-0.5 transition-transform" />
              <span>Wyloguj się</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILNY PANEL NAWIGACJI (< md) */}
      {mobileMenuOpen && (
        <nav
          aria-label="Nawigacja mobilna"
          className="fixed left-4 right-4 top-18 lg:hidden bg-neutral-900/95 backdrop-blur-md text-white rounded-xl border-2 border-neutral-700/50 shadow-2xl z-2000 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          <div className="p-1.5 flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 active:bg-white/5 transition-colors cursor-pointer text-left"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <refractive.header
        refraction={{
          radius: 12,
          blur: 4,
          bezelWidth: 10,
        }}
        className="fixed w-full z-1000 top-0 px-4 sm:px-6 py-4 flex justify-between items-center border-b-2 border-b-neutral-300 drop-shadow-xl bg-bg-1/70"
      >
        <Link to="/" onClick={closeMenus} className="shrink-0">
          <img src={logo} alt="UrbanTransit" className="h-8 sm:h-9 w-auto" />
        </Link>

        <div className="flex gap-3 sm:gap-4 md:gap-9 items-center">
          {/* NAWIGACJA DESKTOP */}
          <nav
            aria-label="Główna nawigacja"
            className="hidden lg:flex md:gap-4 lg:gap-9 items-center"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="hover:underline underline-offset-2 font-medium hover:-translate-y-0.5 transition-transform"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* HAMBURGER — tylko mobile */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-haspopup="menu"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
            className="lg:hidden p-1.5 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size="sm" /> : <Menu size="sm" />}
          </button>

          {/* KONTO / LOGOWANIE — zawsze widoczne */}
          {userLoggedIn ? (
            <button
              type="button"
              onClick={toggleAccountMenu}
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              title="Menu konta"
              className="w-11 h-11 shrink-0 rounded-full cursor-pointer border-2 border-primary-900 hover:-translate-y-0.5 transition-transform overflow-hidden bg-neutral-200 flex items-center justify-center"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <User size="sm" className="text-neutral-500" />
              )}
            </button>
          ) : (
            <Link to="/logowanie" className="bg-primaty-900 text-white px-3 py-1.5 rounded-md cursor-pointer hover:-translate-y-0.5 transition-transform border-2 border-primaty-900 active:border-bg-1">
              Zaloguj się
            </Link>
          )}
        </div>
      </refractive.header>
    </>
  )
}