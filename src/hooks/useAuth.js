import { useState, useEffect } from 'react'
import { auth, loginAnonymously, onAuthStateChanged } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u)
        setLoading(false)
      } else {
        loginAnonymously().then(() => setLoading(false)).catch(() => setLoading(false))
      }
    })
    return unsub
  }, [])

  return { user, loading }
}
