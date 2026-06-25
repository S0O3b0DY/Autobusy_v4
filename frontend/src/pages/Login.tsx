// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import logo from "/logo.svg"

import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"
import { refractive } from "@hashintel/refractive"
import { googleIcon, facebookIcon, githubIconLight, microsoftIcon } from "../const/icons"
import { useAppStore } from "../lib/store"

import { GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, OAuthProvider } from "firebase/auth"
import { doSignInWithPopup, doSignInWithRedirect } from './../lib/authService.ts'



export default function LoginPage() {
  const { user } = useAuth()
  const { shownLines, favoriteStops } = useAppStore()

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

  console.log(user)

  if (user) {
    return <Navigate to="/app" />
  }

  return (
    <div className="bg-bg-1 min-h-screen flex flex-col justify-between">
      <refractive.header
        refraction={{
          radius: 12,
          blur: 4,
          bezelWidth: 40,
          glassThickness: 5,
        }}
        className="fixed w-full z-1000 top-0 px-6 py-4 flex justify-between items-center border-b-2 border-b-neutral-300 drop-shadow-xl bg-bg-1/70"
      >
        <Link to="/">
          <img src={logo} alt="UrbanTransit Logo" />
        </Link>
      </refractive.header>

      <main className="px-6 mt-32 max-w-7xl w-full mx-auto grow flex items-center justify-center pb-12">
        <div className="bg-white border-2 border-neutral-200 rounded-3xl p-8 md:p-12 shadow-xl w-full max-w-135">
          <h1 className="text-3xl font-black text-neutral-900 mb-8 text-center md:text-left">
            Zaloguj się do UrbanTransit
          </h1>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => signIn(new FacebookAuthProvider())}
              className="flex justify-center items-center py-2.5 px-4 border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 hover:-translate-y-0.5 transition-transform cursor-pointer active:border-neutral-800"
            >
              <img
                src={facebookIcon}
                className="w-5 h-5"
                alt="Facebook"
              />
              <span className="ml-2 text-sm font-bold text-neutral-700">
                Facebook
              </span>
            </button>
            <button
              onClick={() => signIn(new OAuthProvider("microsoft.com"))}
              className="flex justify-center items-center py-2.5 px-4 border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 hover:-translate-y-0.5 transition-transform cursor-pointer active:border-neutral-800"
            >
              <img
                src={microsoftIcon}
                className="w-5 h-5"
                alt="Microsoft"
              />
              <span className="ml-2 text-sm font-bold text-neutral-700">
                Microsoft
              </span>
            </button>
            <button
              onClick={() => signIn(new GithubAuthProvider())}
              className="flex justify-center items-center py-2.5 px-4 border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 hover:-translate-y-0.5 transition-transform cursor-pointer active:border-neutral-800"
            >
              <img
                src={githubIconLight}
                className="w-5 h-5"
                alt="GitHub"
              />
              <span className="ml-2 text-sm font-bold text-neutral-700">
                GitHub
              </span>
            </button>
          </div>

          <button
            onClick={() => signIn(new GoogleAuthProvider())}
            className="w-full flex justify-center items-center py-2.5 border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 font-bold text-sm text-neutral-700 mb-6 cursor-pointer gap-2 active:border-neutral-800 hover:-translate-y-0.5 transition-transform"
          >
            <img
              src={googleIcon}
              className="w-5 h-5"
              alt="Google"
            />
            Kontynuuj za pomocą Google
          </button>
        </div>
      </main>

      <footer className="px-6 bg-white border-t-2 border-t-neutral-300 py-4 font-mono uppercase font-bold">
        <div className="max-w-7xl mx-auto w-full">
          <Link to="/">
            <img src={logo} className="w-50" alt="" />
          </Link>
          <div className="flex flex-col items-center md:flex-row md:justify-between mt-8 gap-1">
            <Link
              to="/polityka-prywatnosci"
              className="text-blue-500 hover:underline normal-case font-sans"
            >
              Polityka Prywatnosci
            </Link>
            <p className="text-center text-xs md:text-sm">
              © 2026 Szymon Piera. Wszelkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
