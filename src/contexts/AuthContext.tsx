import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, dbF } from '../lib/firebase.ts'
import { doc, getDoc } from "firebase/firestore"
import { useAppStore } from "../lib/store"


const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setShownLines } = useAppStore()
  
  const [user, setUser] = useState<any>(null)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userRef = doc(dbF, "users", fbUser.uid)
        const userSnap = await getDoc(userRef)
        
        const userData = userSnap.exists() ? userSnap.data() : {}

        setUser({
          ...fbUser,
          ...userData
        })
        setShownLines(userData.shownLines)
        setUserLoggedIn(true)
      } else {
        setUser(null)
        setUserLoggedIn(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userLoggedIn, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)