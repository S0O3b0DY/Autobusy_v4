// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { getAuth } from "firebase/auth"

export async function getUserJWTToken() {
  try {
    const auth = getAuth()
    
    const firebaseUser = auth.currentUser

    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true)
      return token
    } else {
      console.log("Brak zalogowanego użytkownika w module Firebase Auth.")
      return null
    }
  } catch (error) {
    console.error("Błąd podczas pobierania tokenu:")
    return null
  }
}