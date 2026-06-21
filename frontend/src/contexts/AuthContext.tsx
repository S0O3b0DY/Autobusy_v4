// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { createContext, useContext, useEffect, useState } from "react"
import { useAppStore } from "../lib/store"

// components
// types
// constants
// other
import { onAuthStateChanged, getRedirectResult, browserPopupRedirectResolver } from "firebase/auth"
import { auth, dbF } from '../lib/firebase.ts'
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import posthog from "posthog-js"



const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setShownLines, shownLines, favoriteStops, setFavoriteStops } = useAppStore()
  const [user, setUser] = useState<any>(null)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Funkcja pomocnicza do załadowania danych z Firestore
    const loadUserData = async (fbUser: any) => {
      const userRef = doc(dbF, "users", fbUser.uid)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.exists() ? userSnap.data() : {}

      userData.shownLines && setShownLines(userData.shownLines)
      userData.favoriteStops && setFavoriteStops(userData.favoriteStops)

      return { ...fbUser, ...userData }
    }

    const init = async () => {
      // Najpierw obsłuż redirect ZANIM odpali onAuthStateChanged
      try {
        const result = await getRedirectResult(auth, browserPopupRedirectResolver)
        console.log(result)
        if (result?.user) {
          // Użytkownik wrócił z redirect – zapisz/zaktualizuj Firestore
          const userRef = doc(dbF, "users", result.user.uid)
          const userSnap = await getDoc(userRef)

          posthog.identify(result.user.uid, {
            email: result.user.email ?? undefined,
            name: result.user.displayName ?? undefined,
            provider: result.user.providerData[0]?.providerId ?? 'unknown',
            email_verified: result.user.emailVerified,
            created_at: result.user.metadata.creationTime,
            photo_url: result.user.photoURL
          })

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: result.user.uid,
              displayName: result.user.displayName,
              email: result.user.email,
              photoURL: result.user.photoURL,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              shownLines: shownLines,
              favoriteStops: favoriteStops
            })
          } else {
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true })
          }
        }
      } catch (err) {
        console.error("getRedirectResult error:", err)
      }

      // Teraz nasłuchuj stanu – odpali się z poprawnym userem
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const fullUser = await loadUserData(fbUser)
          setUser(fullUser)
          setUserLoggedIn(true)

          posthog.identify(fbUser.uid, {
            email: fbUser.email ?? undefined,
            name: fbUser.displayName ?? undefined,
            provider: fbUser.providerData[0]?.providerId ?? 'unknown',
            email_verified: fbUser.emailVerified,
            created_at: fbUser.metadata.creationTime,
            photo_url: fbUser.photoURL
          })
        } else {
          setUser(null)
          setUserLoggedIn(false)
          
          posthog.reset()
        }
        setLoading(false)
      })

      return unsubscribe
    }

    let unsubscribe: (() => void) | undefined

    init().then((unsub) => {
      unsubscribe = unsub
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userLoggedIn, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
