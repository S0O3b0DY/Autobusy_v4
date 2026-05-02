import { createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updatePassword, sendPasswordResetEmail, sendEmailVerification,
  signInWithPopup, signInWithRedirect, browserPopupRedirectResolver } from "firebase/auth"
import { auth, dbF } from "./firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export async function doCreateUserWithEmailAndPassword({email, password}: {email: string, password: string}) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function doSignInWithEmailAndPassword({email, password}: {email: string, password: string}) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function doSignInWithPopup({ shownLines, provider }: { shownLines: string[], _width?: number, _height?: number, provider: any }) {

  // provider.setCustomParameters({ prompt: 'select_account' })

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

      shownLines: shownLines
    })
  } else {
    // Logowanie: Aktualizujemy tylko datę wejścia
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true })
  }

  return result
}

export async function doSignInWithRedirect({ provider }: { provider: any }) {

  // provider.setCustomParameters({ prompt: 'select_account' })

  await signInWithRedirect(auth, provider, browserPopupRedirectResolver)
}

export async function doSignOut() {
  return auth.signOut()
}

export async function doPasswordReset({email}: {email: string}) {
  return sendPasswordResetEmail(auth, email)
}

export async function doPasswordChange({password}: {password: string}) {
  if (auth.currentUser) {
    return updatePassword(auth.currentUser, password)
  }
}

export async function doSendEmailVerification() {
  return auth.currentUser && sendEmailVerification(auth.currentUser, {
    url: `${window.location.origin}/home`
  })
}