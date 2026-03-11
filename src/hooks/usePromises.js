import { useState, useEffect, useContext, useCallback } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import {
  collection, doc, addDoc, deleteDoc, updateDoc, onSnapshot,
  query, orderBy, where, getDocs, setDoc, serverTimestamp, Timestamp
} from 'firebase/firestore'

const CATEGORIES = [
  { id: 'health', label: '건강', icon: '💊' },
  { id: 'habit', label: '습관', icon: '🌟' },
  { id: 'date', label: '데이트', icon: '💕' },
  { id: 'etc', label: '기타', icon: '📌' },
]

const OWNER_TYPES = [
  { id: 'both', label: '함께', icon: '💑' },
  { id: 'me', label: '나만', icon: '🙋' },
  { id: 'partner', label: '자기만', icon: '💕' },
]

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export { CATEGORIES, OWNER_TYPES }

export function usePromises() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [promises, setPromises] = useState([])
  const [checks, setChecks] = useState({}) // { promiseId: { userId: checkedAt } }
  const [allChecks, setAllChecks] = useState({}) // { date: { promiseId: { userId: true } } }
  const [loading, setLoading] = useState(true)
  const [pendingToggles, setPendingToggles] = useState({}) // { promiseId: true/false } local override

  const partnerUid = couple?.users?.find(u => u !== user?.uid)
  const today = getToday()

  // Listen to promises
  useEffect(() => {
    if (!coupleId) return
    const q = query(
      collection(db, 'couples', coupleId, 'promises'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setPromises(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [coupleId])

  // Listen to today's checks
  useEffect(() => {
    if (!coupleId) return
    const unsub = onSnapshot(
      doc(db, 'couples', coupleId, 'promiseDaily', today),
      (snap) => {
        if (snap.exists()) {
          setChecks(snap.data().checks || {})
        } else {
          setChecks({})
        }
      }
    )
    return unsub
  }, [coupleId, today])

  // Load week checks for weekly report
  useEffect(() => {
    if (!coupleId) return
    const weekDates = getWeekDates()
    const unsubs = weekDates.map(date => {
      return onSnapshot(
        doc(db, 'couples', coupleId, 'promiseDaily', date),
        (snap) => {
          setAllChecks(prev => ({
            ...prev,
            [date]: snap.exists() ? (snap.data().checks || {}) : {}
          }))
        }
      )
    })
    return () => unsubs.forEach(u => u())
  }, [coupleId])

  const addPromise = async (name, category = 'etc', owner = 'both') => {
    if (!coupleId || !name.trim()) return
    await addDoc(collection(db, 'couples', coupleId, 'promises'), {
      name: name.trim(),
      category,
      owner, // 'both', 'me' (creator), 'partner'
      createdAt: new Date(),
      createdBy: user.uid,
    })
  }

  const deletePromise = async (promiseId) => {
    if (!coupleId) return
    await deleteDoc(doc(db, 'couples', coupleId, 'promises', promiseId))
  }

  const updatePromise = async (promiseId, data) => {
    if (!coupleId) return
    await updateDoc(doc(db, 'couples', coupleId, 'promises', promiseId), data)
  }

  // Merge pending toggles with Firestore checks for UI
  const getEffectiveCheck = (promiseId) => {
    if (promiseId in pendingToggles) {
      return pendingToggles[promiseId]
    }
    return !!checks[promiseId]?.[user?.uid]
  }

  const toggleCheck = async (promiseId) => {
    if (!coupleId || !user) return
    const dayRef = doc(db, 'couples', coupleId, 'promiseDaily', today)
    const currentlyChecked = getEffectiveCheck(promiseId)
    const newState = !currentlyChecked

    // Instant UI: set pending toggle
    setPendingToggles(prev => ({ ...prev, [promiseId]: newState }))

    try {
      if (newState) {
        // Check
        await setDoc(dayRef, {
          date: today,
          [`checks.${promiseId}.${user.uid}`]: new Date().toISOString()
        }, { merge: true })
      } else {
        // Uncheck
        const { deleteField } = await import('firebase/firestore')
        await setDoc(dayRef, { date: today }, { merge: true })
        await updateDoc(dayRef, {
          [`checks.${promiseId}.${user.uid}`]: deleteField()
        })
      }
    } catch (e) {
      console.error('체크 저장 실패:', e)
    }

    // Clear pending after Firestore syncs (small delay to let onSnapshot catch up)
    setTimeout(() => {
      setPendingToggles(prev => {
        const next = { ...prev }
        delete next[promiseId]
        return next
      })
    }, 2000)
  }

  // Calculate streak for a promise
  const getStreak = useCallback((promiseId) => {
    if (!user || !partnerUid) return 0
    // We need historical data for streaks - check allChecks
    const dates = Object.keys(allChecks).sort().reverse()
    let streak = 0

    // Check backwards from yesterday (today might not be complete)
    const sortedDates = []
    const d = new Date()
    d.setDate(d.getDate() - 1) // start from yesterday
    for (let i = 0; i < 30; i++) {
      sortedDates.push(d.toISOString().split('T')[0])
      d.setDate(d.getDate() - 1)
    }

    // For now, use available allChecks data
    for (const date of sortedDates) {
      const dayChecks = allChecks[date]
      if (!dayChecks) break
      const pc = dayChecks[promiseId]
      if (pc && pc[user.uid] && pc[partnerUid]) {
        streak++
      } else {
        break
      }
    }

    // If both checked today, add today to streak
    const todayChecks = checks[promiseId]
    if (todayChecks && todayChecks[user.uid] && todayChecks[partnerUid]) {
      // Only add if streak is continuous or this is the start
      streak++
    }

    return streak
  }, [checks, allChecks, user, partnerUid])

  // Weekly report
  const getWeeklyReport = useCallback(() => {
    if (!user || !partnerUid || promises.length === 0) return null
    const weekDates = getWeekDates()
    const todayIdx = weekDates.indexOf(today)
    const relevantDates = weekDates.slice(0, todayIdx + 1)
    if (relevantDates.length === 0) return null

    let total = 0
    let completed = 0

    for (const date of relevantDates) {
      for (const p of promises) {
        total += 2 // both users need to check
        const dc = allChecks[date]?.[p.id]
        if (dc?.[user.uid]) completed++
        if (dc?.[partnerUid]) completed++
      }
    }

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { rate, completed, total }
  }, [promises, allChecks, user, partnerUid, today])

  // Get recent partner check notifications
  const getPartnerRecentChecks = useCallback(() => {
    if (!partnerUid) return []
    const result = []
    for (const p of promises) {
      const pc = checks[p.id]
      if (pc?.[partnerUid] && !pc?.[user.uid]) {
        // Partner checked but I haven't
        result.push(p)
      }
    }
    return result
  }, [promises, checks, partnerUid, user])

  return {
    promises,
    checks,
    loading,
    today,
    partnerUid,
    addPromise,
    deletePromise,
    updatePromise,
    toggleCheck,
    getEffectiveCheck,
    getStreak,
    getWeeklyReport,
    getPartnerRecentChecks,
    CATEGORIES,
  }
}
