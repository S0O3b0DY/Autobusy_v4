// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { signInWithPopup, signInWithRedirect, browserPopupRedirectResolver, deleteUser } from "firebase/auth"
import { auth, dbF } from "./firebase"
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore"

export async function doSignInWithPopup({ shownLines, provider, favoriteStops }: { shownLines: string[], _width?: number, _height?: number, provider: any, favoriteStops: number[] }) {
  const result = await signInWithPopup(auth, provider)
  const user = result.user

  const userRef = doc(dbF, "users", user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    // Rejestracja: Tworzymy nowy profil
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      favoriteStops: favoriteStops,
      shownLines: shownLines,
      onboardingFinished: false
    })
  } else {
    // Logowanie: Aktualizujemy tylko datę wejścia
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true })
  }

  return result
}

export async function doSignInWithRedirect({ provider }: { provider: any }) {
  await signInWithRedirect(auth, provider, browserPopupRedirectResolver)
}

export async function doSignOut() {
  return auth.signOut()
}


export async function doDeleteUser() {
  const user = auth.currentUser
  if (!user) return

  await deleteDoc(doc(dbF, "users", user.uid))
  await deleteUser(user)
}