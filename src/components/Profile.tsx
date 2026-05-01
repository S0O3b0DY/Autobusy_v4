import { useState, useLayoutEffect, useRef } from "react"
import { useAppStore } from "../lib/store"
import { useAuth } from '../contexts/AuthContext.tsx'
import gsap from 'gsap'
import { X, User, ArrowOutRightSquareHalf, Google, Lock, Envelope, Check, InfoCircle, RefreshCwAlt, ArrowDown, UserCircle } from "@boxicons/react"
import { doSignInWithGooglePopup, doSignOut, doSignInWithEmailAndPassword, doCreateUserWithEmailAndPassword } from './../lib/authService.ts'
import googleIcon from "/public/GoogleIcon.svg"

export default function Profile() {
  const { userLoggedIn, user } = useAuth()
  const { shownLines } = useAppStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  
  const cardRef = useRef(null)

  // Wyrafinowana animacja wejścia GSAP (iOS Spring)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, 
        { y: 30, opacity: 0, scale: 0.96 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.85)" }
      )
    })
    return () => ctx.revert()
  }, [userLoggedIn, isRegister])

  // Style wspólne dla inputów
  const inputBase = "w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-zinc-200"
  const iconBase = "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors"

  // --- WIDOK ZALOGOWANEGO ---
  if (userLoggedIn) {
    return (
      <div ref={cardRef} className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        {/* Header Profilu */}
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-4">
          <div className="relative shrink-0">
            {user.photoURL ? (
              <img src={user.photoURL} className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm" alt="avatar" />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <User size="sm" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950"></div>
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] font-black truncate text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">
              {user.displayName || 'N/A'}
            </h2>
            <p className="text-[11px] text-zinc-500 truncate font-medium">{user.email}</p>
          </div>
        </div>

        {/* Statystyki / Dane */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">Aktywne Filtry</span>
              <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400">
                {shownLines.length > 0 ? `${shownLines.length} linii` : 'Brak'}
              </span>
            </div>
            {/* <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">Status konta</span>
              <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">Standard</span>
            </div> */}
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-2.5 rounded-xl transition-all active:scale-95 text-xs">
            <InfoCircle size="xs" /> Zarządzaj danymi
          </button>

          <button 
            onClick={doSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 font-black py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-[11px] uppercase tracking-widest border border-red-100 dark:border-red-900/30"
          >
            <ArrowOutRightSquareHalf size="xs" /> Wyloguj się
          </button>
        </div>
      </div>
    )
  }

  // --- WIDOK LOGOWANIA / REJESTRACJI ---
  return (
    <div ref={cardRef} className="w-full mx-auto bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
      <div className="px-8 md:px-15 pt-8 pb-6 space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-4 text-white">
            <UserCircle size="md" />
          </div>
          <h1 className="text-[18px] font-black text-zinc-800 dark:text-zinc-100 tracking-tighter uppercase">
            {isRegister ? 'Utwórz konto' : 'Logowanie'}
          </h1>
          <p className="text-[12px] text-zinc-500 font-medium mt-1 leading-snug">
            Zsynchronizuj swoje linie i inne ustawienia.
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <Envelope size="xs" className={iconBase} />
            <input 
              type="email" 
              placeholder="Email" 
              className={inputBase}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Lock size="xs" className={iconBase} />
            <input 
              type="password" 
              placeholder="Hasło" 
              className={inputBase}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-[10px] text-red-500 font-bold uppercase text-center tracking-tighter">{error}</p>}

          <button 
            onClick={() => isRegister ? doCreateUserWithEmailAndPassword({ email, password }) : doSignInWithEmailAndPassword({ email, password })}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.97] transition-all text-xs uppercase tracking-widest"
          >
            <Check size="xs" />
            {isRegister ? 'Zarejestruj' : 'Zaloguj'}
          </button>
        </div>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
          <span className="shrink mx-4 text-[10px] font-black text-zinc-300 uppercase tracking-widest">lub</span>
          <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
        </div>

        <button 
          onClick={() => doSignInWithGooglePopup({ shownLines })}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-3 rounded-xl text-[13px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all shadow-sm"
        >
          <img src={googleIcon} alt="Logo firmy Google" className="w-5" />
          Kontynuuj z Google
        </button>
      </div>

      <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50 text-center">
        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="text-[11px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
        >
          {isRegister ? 'Masz już konto? Zaloguj' : 'Brak konta? Załóż je teraz'}
        </button>
      </div>
    </div>
  )
}