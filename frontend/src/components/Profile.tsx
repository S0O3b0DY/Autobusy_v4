// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useTheme } from "../hooks/useTheme.ts"
import { useTranslation } from "react-i18next"
import { useLayoutEffect, useRef } from "react"
import { useAppStore } from "../lib/store"
import { useAuth } from '../contexts/AuthContext.tsx'

// components
import { User, ArrowOutRightSquareHalf, UserCircle } from "@boxicons/react"

// types
// constants
import { googleIcon, facebookIcon, githubIconLight, githubIconDark, microsoftIcon } from './../const/icons.ts'

// other
import gsap from 'gsap'
import { GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, OAuthProvider } from "firebase/auth"
import { doSignInWithPopup, doSignOut, doSignInWithRedirect } from './../lib/authService.ts'



export default function Profile() {
  const { userLoggedIn, user } = useAuth()
  const { shownLines, favoriteStops } = useAppStore()
  const { t } = useTranslation()
  const { isDark } = useTheme()
  
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
  }, [userLoggedIn])

  function isMobile() { return window.matchMedia("(max-width: 768px)").matches }

  async function signIn(provider: any) {
    if (isMobile()) {
      await doSignInWithRedirect({ provider })
    } else {
      try {
        await doSignInWithPopup({ shownLines, provider, favoriteStops })
      } catch (error: any) {
        console.error("Błąd logowania popup:", error.message);
      }
    }
  }


  // --- WIDOK ZALOGOWANEGO ---
  if (userLoggedIn) {
    return (
      <div ref={cardRef} className="w-full max-w-sm mx-auto bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        {/* Header Profilu */}
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-4">
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
              <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">{t('profile.stats.activeFilters')}</span>
              <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400">
                {shownLines.length > 0 ? t('profile.stats.linesCount', { count: shownLines.length }) : t('profile.stats.noLines')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">{t('profile.stats.savedStops')}</span>
              <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">{favoriteStops.length}</span>
            </div>
          </div>

          <button 
            onClick={doSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 font-black py-3 rounded-xl hover:bg-red-600 hover:text-white
              transition-all active:scale-95 text-[11px] uppercase tracking-widest border border-red-100 dark:border-red-900/30 cursor-pointer"
          >
            <ArrowOutRightSquareHalf size="xs" /> {t('profile.signOut')}
          </button>
        </div>
      </div>
    )
  }

  // --- WIDOK LOGOWANIA / REJESTRACJI ---
  return (
    <div ref={cardRef} className="w-full mx-auto bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
      <div className="px-8 pt-8 pb-6 space-y-6 flex flex-col md:flex-row w-full gap-0 md:gap-8">
        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-4 text-white">
            <UserCircle size="md" />
          </div>
          <h1 className="text-[18px] font-black text-zinc-800 dark:text-zinc-100 tracking-tighter uppercase">
            {t('profile.login.title')}
          </h1>
          <p className="text-[12px] text-zinc-500 font-medium mt-1 leading-snug">
            {t('profile.login.subtitle')}
          </p>
          <div className="text-xs opacity-30 mt-0.5">Release: {__APP_VERSION__}; {__BUILD_DATE__}</div>
        </div>
        <div className="grow">
          <button 
            onClick={() => signIn(new GoogleAuthProvider())}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-3 rounded-xl text-[13px] font-bold
              text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <img src={googleIcon} alt="Logo firmy Google" className="w-5" />
            {t('profile.login.continueWithGoogle')}
          </button>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
            <span className="shrink mx-4 text-[10px] font-black text-zinc-300 uppercase tracking-widest">{t('profile.login.or')}</span>
            <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
          </div>

          <button 
            onClick={() => signIn(new FacebookAuthProvider())}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-3 rounded-xl text-[13px] font-bold
              text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <img src={facebookIcon} alt="Logo firmy Facebook" className="w-5" />
            {t('profile.login.continueWithFacebook')}
          </button>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
            <span className="shrink mx-4 text-[10px] font-black text-zinc-300 uppercase tracking-widest">{t('profile.login.or')}</span>
            <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
          </div>

          <button 
            onClick={() => signIn(new OAuthProvider("microsoft.com"))}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-3 rounded-xl text-[13px] font-bold
              text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <img src={microsoftIcon} alt="Logo firmy Microsoft" className="w-5" />
            {t('profile.login.continueWithMicrosoft')}
          </button>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
            <span className="shrink mx-4 text-[10px] font-black text-zinc-300 uppercase tracking-widest">{t('profile.login.or')}</span>
            <div className="grow border-t border-zinc-100 dark:border-zinc-900"></div>
          </div>

          <button 
            onClick={() => signIn(new GithubAuthProvider())}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-3 rounded-xl text-[13px] font-bold
              text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <img src={isDark ? githubIconDark : githubIconLight} alt="Logo firmy Github" className="w-5" />
            {t('profile.login.continueWithGithub')}
          </button>
        </div>
      </div>
    </div>
  )
}