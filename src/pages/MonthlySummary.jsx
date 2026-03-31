import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export default function MonthlySummary() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [diaries, setDiaries] = useState([])
  const [letters, setLetters] = useState([])
  const [expandedMonth, setExpandedMonth] = useState(null)

  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.userNames?.[user.uid]?.myName || couple?.names?.[user.uid] || '나'
  const partnerName = couple?.userNames?.[user.uid]?.partnerName || (partnerUid ? couple?.names?.[partnerUid] : null) || '상대방'
  const myAnimal = couple?.animals?.[user.uid] || ''
  const partnerAnimal = couple?.animals?.[partnerUid] || ''

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'diaries'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setDiaries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'letters'), orderBy('openDate', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setLetters(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  // Group diaries by month
  const monthlyData = {}
  diaries.forEach(d => {
    const month = d.date?.substring(0, 7)
    if (!month) return
    if (!monthlyData[month]) {
      monthlyData[month] = { diaries: [], letters: [], photos: 0 }
    }
    monthlyData[month].diaries.push(d)
    const photoCount = d.photoURLs?.length || (d.photoURL ? 1 : 0)
    monthlyData[month].photos += photoCount
  })

  // Group letters by month (using createdAt date)
  letters.forEach(l => {
    const ts = l.createdAt?.toDate ? l.createdAt.toDate() : (l.createdAt ? new Date(l.createdAt) : null)
    if (!ts) return
    const month = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[month]) {
      monthlyData[month] = { diaries: [], letters: [], photos: 0 }
    }
    monthlyData[month].letters.push(l)
  })

  const months = Object.keys(monthlyData).sort().reverse()

  const formatMonthLabel = (m) => {
    const [year, month] = m.split('-')
    return `${year}년 ${parseInt(month)}월`
  }

  const getMonthEmoji = (monthNum) => {
    const emojis = ['❄️', '💝', '🌸', '🌷', '🌿', '☀️', '🌊', '🍉', '🍂', '🎃', '🍁', '🎄']
    return emojis[(monthNum - 1) % 12]
  }

  const getPreview = (entries) => {
    if (entries.length === 0) return null
    // Get first entry with content
    const withContent = entries.filter(e => e.content?.trim())
    if (withContent.length === 0) return null
    const first = withContent[0]
    return first.content.substring(0, 80) + (first.content.length > 80 ? '...' : '')
  }

  const getWriterStats = (entries) => {
    const mine = entries.filter(e => e.authorUid === user.uid).length
    const partner = entries.length - mine
    return { mine, partner }
  }

  const getKeyDates = (entries) => {
    if (entries.length === 0) return []
    // Get unique dates
    const dates = [...new Set(entries.map(e => e.date).filter(Boolean))].sort()
    if (dates.length <= 3) return dates
    return [dates[0], `... ${dates.length}일`, dates[dates.length - 1]]
  }

  return (
    <div className="fade-in">
      <div className="page-header">📊 월별 추억 요약</div>
      <div style={{ padding: '0 20px' }}>
        {months.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>아직 기록이 없어요</div>
            <div style={{ fontSize: 14 }}>다이어리나 편지를 작성하면 월별 요약이 나타나요!</div>
          </div>
        ) : (
          <>
            {/* Overview stats */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, var(--pink), var(--coral))',
              color: 'white',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>우리의 기록 총 요약</div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{diaries.length}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>일기</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{letters.length}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>편지</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {Object.values(monthlyData).reduce((sum, m) => sum + m.photos, 0)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>사진</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{months.length}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>개월</div>
                </div>
              </div>
            </div>

            {/* Monthly cards */}
            {months.map(month => {
              const data = monthlyData[month]
              const monthNum = parseInt(month.split('-')[1])
              const emoji = getMonthEmoji(monthNum)
              const stats = getWriterStats(data.diaries)
              const preview = getPreview(data.diaries)
              const isExpanded = expandedMonth === month
              const keyDates = getKeyDates(data.diaries)

              return (
                <div
                  key={month}
                  className="card"
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setExpandedMonth(isExpanded ? null : month)}
                >
                  {/* Month header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'var(--pink-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                      }}>
                        {emoji}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{formatMonthLabel(month)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                          일기 {data.diaries.length}개
                          {data.letters.length > 0 && ` · 편지 ${data.letters.length}개`}
                          {data.photos > 0 && ` · 사진 ${data.photos}장`}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-light)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                      ▼
                    </span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="fade-in" style={{ marginTop: 16 }}>
                      {/* Writer stats */}
                      <div style={{
                        display: 'flex', gap: 8, marginBottom: 12,
                      }}>
                        <div style={{
                          flex: 1, padding: '10px 12px', borderRadius: 12,
                          background: 'var(--pink-bg)', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 2 }}>{myAnimal} {myName}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)' }}>{stats.mine}개</div>
                        </div>
                        <div style={{
                          flex: 1, padding: '10px 12px', borderRadius: 12,
                          background: '#fff3e0', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 2 }}>{partnerAnimal} {partnerName}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--coral)' }}>{stats.partner}개</div>
                        </div>
                      </div>

                      {/* Key dates */}
                      {keyDates.length > 0 && (
                        <div style={{
                          padding: '8px 12px', borderRadius: 10,
                          background: '#f3e5f5', marginBottom: 12,
                          fontSize: 13, color: '#7b1fa2',
                        }}>
                          📅 기록한 날: {keyDates.join(' → ')}
                        </div>
                      )}

                      {/* Preview of entries */}
                      {preview && (
                        <div style={{
                          padding: '12px', borderRadius: 10,
                          background: '#fafafa', fontSize: 14,
                          lineHeight: 1.6, color: 'var(--text)',
                          borderLeft: '3px solid var(--pink-light)',
                        }}>
                          💬 "{preview}"
                        </div>
                      )}

                      {/* Letters in this month */}
                      {data.letters.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)', marginBottom: 6 }}>
                            💌 이 달의 편지
                          </div>
                          {data.letters.map(l => (
                            <div key={l.id} style={{
                              padding: '8px 12px', borderRadius: 10,
                              background: '#fff8e1', marginBottom: 4,
                              fontSize: 13,
                            }}>
                              {l.authorUid === user.uid ? myName : partnerName}: {l.title || '💌 편지'}
                              <span style={{ color: 'var(--text-light)', marginLeft: 6, fontSize: 11 }}>
                                (개봉일: {l.openDate})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Photo thumbnails */}
                      {data.photos > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)', marginBottom: 6 }}>
                            📷 이 달의 사진 ({data.photos}장)
                          </div>
                          <div style={{
                            display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4,
                          }}>
                            {data.diaries
                              .filter(d => d.photoURL || d.photoURLs?.length)
                              .slice(0, 6)
                              .map((d, i) => (
                                <img
                                  key={i}
                                  src={d.photoURLs?.[0] || d.photoURL}
                                  alt=""
                                  style={{
                                    width: 64, height: 64, borderRadius: 8,
                                    objectFit: 'cover', flexShrink: 0,
                                  }}
                                  loading="lazy"
                                />
                              ))}
                            {data.photos > 6 && (
                              <div style={{
                                width: 64, height: 64, borderRadius: 8,
                                background: 'var(--pink-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, color: 'var(--pink)', fontWeight: 600, flexShrink: 0,
                              }}>
                                +{data.photos - 6}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
