// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import logo from "/assets/logo.svg"
import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="px-6 bg-white border-t-2 border-t-neutral-300 py-4 font-mono uppercase font-bold">
      <Link to="/">
        <img src={logo} className="w-50" alt="" />
      </Link>
      <div className="flex flex-col items-center md:flex-row md:justify-between mt-8 gap-1">
        <Link
          to="/polityka-prywatnosci"
          className="text-blue-500 hover:underline text-sm"
        >
          polityka prywatnosci
        </Link>
        <p className="text-center text-sm">© 2026 Szymon Piera. Wszelkie prawa zastrzeżone.</p>
      </div>
    </footer>
  )
}
