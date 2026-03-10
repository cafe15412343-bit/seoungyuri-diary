import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, updateDoc } from 'firebase/firestore'

const COUPLE_CODE_KEY = 'couple-diary-code'
const COUPLE_ID_KEY = 'couple-diary-id'

export function useCouple(user) {
  const [couple, setCouple] = useState(null)
  const [coupleId, setCoupleId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Check localStorage for saved couple code first
    const savedCoupleId = localStorage.getItem(COUPLE_ID_KEY)
    const savedCode = localStorage.getItem(COUPLE_CODE_KEY)

    if (savedCoupleId) {
      // We have a saved coupleId, listen to it directly
      const unsub = onSnapshot(doc(db, 'couples', savedCoupleId), (snap) => {
        if (snap.exists()) {
          setCoupleId(savedCoupleId)
          setCouple({ id: snap.id, ...snap.data() })
        } else {
          // Couple doc deleted, clear local
          localStorage.removeItem(COUPLE_ID_KEY)
          localStorage.removeItem(COUPLE_CODE_KEY)
          setCoupleId(null)
          setCouple(null)
        }
        setLoading(false)
      })
      return () => unsub()
    } else if (savedCode) {
      // Have code but no coupleId cached, look it up
      getDoc(doc(db, 'codes', savedCode)).then((codeSnap) => {
        if (codeSnap.exists()) {
          const cId = codeSnap.data().coupleId
          localStorage.setItem(COUPLE_ID_KEY, cId)
          setCoupleId(cId)
          const unsub = onSnapshot(doc(db, 'couples', cId), (snap) => {
            if (snap.exists()) setCouple({ id: snap.id, ...snap.data() })
            setLoading(false)
          })
          // Can't return unsub easily here, but it's a one-time path
        } else {
          localStorage.removeItem(COUPLE_CODE_KEY)
          setLoading(false)
        }
      }).catch(() => setLoading(false))
    } else {
      // Fallback: check user doc (backward compat)
      const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists() && snap.data().coupleId) {
          const cId = snap.data().coupleId
          setCoupleId(cId)
          localStorage.setItem(COUPLE_ID_KEY, cId)
          const unsub2 = onSnapshot(doc(db, 'couples', cId), (cSnap) => {
            if (cSnap.exists()) {
              const data = cSnap.data()
              setCouple({ id: cSnap.id, ...data })
              if (data.code) localStorage.setItem(COUPLE_CODE_KEY, data.code)
            }
            setLoading(false)
          })
          return () => unsub2()
        } else {
          setCouple(null)
          setCoupleId(null)
          setLoading(false)
        }
      })
      return () => unsub()
    }
  }, [user])

  const generateCode = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const cRef = doc(collection(db, 'couples'))
    await setDoc(cRef, {
      code,
      users: [user.uid],
      createdAt: new Date(),
      startDate: null,
      names: { [user.uid]: '나' }
    })
    await setDoc(doc(db, 'users', user.uid), { coupleId: cRef.id }, { merge: true })
    await setDoc(doc(db, 'codes', code), { coupleId: cRef.id })

    // Save to localStorage
    localStorage.setItem(COUPLE_CODE_KEY, code)
    localStorage.setItem(COUPLE_ID_KEY, cRef.id)

    return code
  }

  const joinWithCode = async (code) => {
    const upperCode = code.toUpperCase()
    const codeSnap = await getDoc(doc(db, 'codes', upperCode))
    if (!codeSnap.exists()) throw new Error('코드를 찾을 수 없어요 😢')
    const cId = codeSnap.data().coupleId
    const coupleSnap = await getDoc(doc(db, 'couples', cId))
    if (!coupleSnap.exists()) throw new Error('커플 정보를 찾을 수 없어요')
    const data = coupleSnap.data()

    // If this user is already in the couple, just link
    if (!data.users.includes(user.uid)) {
      if (data.users.length >= 2) throw new Error('이미 연결된 커플이에요')
      await updateDoc(doc(db, 'couples', cId), {
        users: [...data.users, user.uid],
        names: { ...data.names, [user.uid]: '상대방' }
      })
    }
    await setDoc(doc(db, 'users', user.uid), { coupleId: cId }, { merge: true })

    // Save to localStorage
    localStorage.setItem(COUPLE_CODE_KEY, upperCode)
    localStorage.setItem(COUPLE_ID_KEY, cId)
  }

  const loginWithCode = async (code) => {
    const upperCode = code.toUpperCase()
    const codeSnap = await getDoc(doc(db, 'codes', upperCode))
    if (!codeSnap.exists()) throw new Error('코드를 찾을 수 없어요 😢')
    const cId = codeSnap.data().coupleId
    const coupleSnap = await getDoc(doc(db, 'couples', cId))
    if (!coupleSnap.exists()) throw new Error('커플 정보를 찾을 수 없어요')

    // Save to localStorage - this gives access to the couple data
    localStorage.setItem(COUPLE_CODE_KEY, upperCode)
    localStorage.setItem(COUPLE_ID_KEY, cId)

    // Reload to pick up the new couple
    window.location.reload()
  }

  const logout = () => {
    localStorage.removeItem(COUPLE_CODE_KEY)
    localStorage.removeItem(COUPLE_ID_KEY)
    window.location.reload()
  }

  return { couple, coupleId, loading, generateCode, joinWithCode, loginWithCode, logout }
}
