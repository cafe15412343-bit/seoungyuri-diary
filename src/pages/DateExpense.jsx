import { useState, useEffect, useContext, useMemo } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore'

const EXPENSE_CATEGORIES = [
  { id: 'food', icon: '🍽️', label: '식비' },
  { id: 'cafe', icon: '☕', label: '카페' },
  { id: 'transport', icon: '🚗', label: '교통' },
  { id: 'activity', icon: '🎬', label: '놀거리' },
  { id: 'shopping', icon: '🛍️', label: '쇼핑' },
  { id: 'gift', icon: '🎁', label: '선물' },
  { id: 'etc', icon: '📌', label: '기타' },
]

function formatMoney(n) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function DateExpense() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [expenses, setExpenses] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [category, setCategory] = useState('food')
  const [paidBy, setPaidBy] = useState('me')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.userNames?.[user.uid]?.myName || couple?.names?.[user.uid] || '나'
  const partnerName = couple?.userNames?.[user.uid]?.partnerName || (partnerUid ? couple?.names?.[partnerUid] : null) || '상대방'
  const myAnimal = couple?.animals?.[user.uid] || ''
  const partnerAnimal = couple?.animals?.[partnerUid] || ''

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'expenses'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  const handleAdd = async () => {
    const num = parseInt(amount.replace(/[^0-9]/g, ''))
    if (!num || num <= 0) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'expenses'), {
        amount: num,
        memo: memo.trim(),
        category,
        paidBy: paidBy === 'me' ? user.uid : (paidBy === 'partner' ? partnerUid : 'both'),
        date,
        createdBy: user.uid,
        createdAt: new Date(),
      })
      setAmount('')
      setMemo('')
      setCategory('food')
      setDate(new Date().toISOString().split('T')[0])
      setShowAdd(false)
    } catch (e) {
      alert('저장 실패: ' + e.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (confirm('이 기록을 삭제할까요?')) {
      await deleteDoc(doc(db, 'couples', coupleId, 'expenses', id))
    }
  }

  // Filter by month
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date?.startsWith(viewMonth))
  }, [expenses, viewMonth])

  // Stats
  const stats = useMemo(() => {
    let total = 0, myTotal = 0, partnerTotal = 0, bothTotal = 0
    const byCategory = {}

    monthExpenses.forEach(e => {
      total += e.amount
      if (e.paidBy === user.uid) myTotal += e.amount
      else if (e.paidBy === partnerUid) partnerTotal += e.amount
      else bothTotal += e.amount

      const cat = e.category || 'etc'
      byCategory[cat] = (byCategory[cat] || 0) + e.amount
    })

    // Sort categories by amount
    const catSorted = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([id, amount]) => ({
        ...EXPENSE_CATEGORIES.find(c => c.id === id) || EXPENSE_CATEGORIES[6],
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))

    return { total, myTotal, partnerTotal, bothTotal, byCategory: catSorted }
  }, [monthExpenses, user.uid, partnerUid])

  // Month navigation
  const changeMonth = (delta) => {
    const [y, m] = viewMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta)
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthLabel = (() => {
    const [y, m] = viewMonth.split('-')
    return `${y}년 ${parseInt(m)}월`
  })()

  const getCategoryInfo = (id) => EXPENSE_CATEGORIES.find(c => c.id === id) || EXPENSE_CATEGORIES[6]

  const getPaidByName = (e) => {
    if (e.paidBy === user.uid) return `${myAnimal} ${myName}`
    if (e.paidBy === partnerUid) return `${partnerAnimal} ${partnerName}`
    return '💑 함께'
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>💰 데이트 가계부</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ fontSize: 14, background: 'var(--pink)', color: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 500 }}
        >
          {showAdd ? '✕ 닫기' : '➕ 기록'}
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Month Selector */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 12,
        }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', fontSize: 20, padding: '4px 12px' }}>◀</button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ background: 'none', fontSize: 20, padding: '4px 12px' }}>▶</button>
        </div>

        {/* Stats Card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--pink), var(--coral))', color: 'white',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>이번 달 총 지출</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{formatMoney(stats.total)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMoney(stats.myTotal)}</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>{myAnimal} {myName}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMoney(stats.partnerTotal)}</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>{partnerAnimal} {partnerName}</div>
            </div>
            {stats.bothTotal > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMoney(stats.bothTotal)}</div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>💑 함께</div>
              </div>
            )}
          </div>
          {/* Settlement suggestion */}
          {stats.myTotal !== stats.partnerTotal && (stats.myTotal + stats.partnerTotal > 0) && (
            <div style={{
              marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.2)',
              borderRadius: 12, fontSize: 13, textAlign: 'center',
            }}>
              {stats.myTotal > stats.partnerTotal
                ? `${partnerName}이(가) ${myName}에게 ${formatMoney(Math.round((stats.myTotal - stats.partnerTotal) / 2))} 보내면 정산 완료! 💸`
                : `${myName}이(가) ${partnerName}에게 ${formatMoney(Math.round((stats.partnerTotal - stats.myTotal) / 2))} 보내면 정산 완료! 💸`
              }
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        {stats.byCategory.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>📊 카테고리별 지출</div>
            {stats.byCategory.map(c => (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{c.icon} {c.label}</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(c.amount)} ({c.percent}%)</span>
                </div>
                <div style={{ height: 6, background: 'var(--pink-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${c.percent}%`, height: '100%',
                    background: 'linear-gradient(90deg, var(--pink), var(--coral))',
                    borderRadius: 3, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Form */}
        {showAdd && (
          <div className="card fade-in" style={{ borderLeft: '4px solid var(--pink)' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>💸 지출 기록</div>

            <input
              className="input-field"
              placeholder="금액 (숫자만)"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              autoFocus
              style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}
            />
            {amount && (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--pink)', marginTop: 4, fontWeight: 600 }}>
                {formatMoney(parseInt(amount) || 0)}
              </div>
            )}

            <input
              className="input-field"
              placeholder="메모 (예: 점심 파스타)"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              style={{ marginTop: 8 }}
            />

            <input
              type="date"
              className="input-field"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ marginTop: 8 }}
            />

            {/* Category */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>카테고리</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EXPENSE_CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 16, fontSize: 13,
                      background: category === c.id ? 'linear-gradient(135deg, var(--pink), var(--coral))' : 'var(--pink-bg)',
                      color: category === c.id ? 'white' : 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Who paid */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>누가 냈어?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'me', label: `${myAnimal} ${myName}` },
                  { id: 'partner', label: `${partnerAnimal} ${partnerName}` },
                  { id: 'both', label: '💑 함께' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPaidBy(p.id)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 16, fontSize: 13,
                      background: paidBy === p.id ? 'linear-gradient(135deg, var(--pink), var(--coral))' : 'var(--pink-bg)',
                      color: paidBy === p.id ? 'white' : 'var(--text)',
                      fontWeight: 600,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleAdd}
              disabled={saving || !amount}
              style={{ marginTop: 16 }}
            >
              {saving ? '저장 중...' : '💰 기록하기'}
            </button>
          </div>
        )}

        {/* Expense List */}
        {monthExpenses.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {monthExpenses.map(e => {
              const cat = getCategoryInfo(e.category)
              return (
                <div key={e.id} className="card" style={{ padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'var(--pink-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                      }}>
                        {cat.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                          {e.memo || cat.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                          {e.date} · {getPaidByName(e)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--pink)' }}>
                        {formatMoney(e.amount)}
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        style={{ background: 'none', fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {monthExpenses.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{monthLabel} 지출 기록이 없어요</div>
            <div style={{ fontSize: 14 }}>데이트 비용을 기록해보세요!</div>
          </div>
        )}
      </div>
    </div>
  )
}
