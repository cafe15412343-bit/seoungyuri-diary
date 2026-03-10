import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, updateDoc } from 'firebase/firestore'

export function useCouple(user) {
  const [couple, setCouple] = useState(null)
  const [coupleId, setCoupleId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // Listen for user's couple link
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && snap.data().coupleId) {
        setCoupleId(snap.data().coupleId)
        // Listen for couple doc
        const unsub2 = onSnapshot(doc(db, 'couples', snap.data().coupleId), (cSnap) => {
          if (cSnap.exists()) setCouple({ id: cSnap.id, ...cSnap.data() })
          setLoading(false)
        })
        return () => unsub2()
      } else {
        setCouple(null)
        setCoupleId(null)
        setLoading(false)
      }
    })
    return unsub
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
    // Also store code mapping for lookup
    await setDoc(doc(db, 'codes', code), { coupleId: cRef.id })
    return code
  }

  const joinWithCode = async (code) => {
    const codeSnap = await getDoc(doc(db, 'codes', code.toUpperCase()))
    if (!codeSnap.exists()) throw new Error('코드를 찾을 수 없어요 😢')
    const cId = codeSnap.data().coupleId
    const coupleSnap = await getDoc(doc(db, 'couples', cId))
    if (!coupleSnap.exists()) throw new Error('커플 정보를 찾을 수 없어요')
    const data = coupleSnap.data()
    if (data.users.length >= 2) throw new Error('이미 연결된 커플이에요')
    if (data.users.includes(user.uid)) throw new Error('본인의 코드예요!')
    await updateDoc(doc(db, 'couples', cId), {
      users: [...data.users, user.uid],
      names: { ...data.names, [user.uid]: '상대방' }
    })
    await setDoc(doc(db, 'users', user.uid), { coupleId: cId }, { merge: true })
  }

  return { couple, coupleId, loading, generateCode, joinWithCode }
}
