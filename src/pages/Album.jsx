import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export default function Album() {
  const { coupleId } = useContext(AppContext)
  const [photos, setPhotos] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [viewPhoto, setViewPhoto] = useState(null)

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'diaries'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const allPhotos = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.photoURL)
        .map(d => ({ url: d.photoURL, date: d.date, content: d.content }))
      setPhotos(allPhotos)
    })
    return unsub
  }, [coupleId])

  const months = [...new Set(photos.map(p => p.date?.substring(0, 7)))].sort().reverse()
  const filtered = photos.filter(p => p.date?.startsWith(selectedMonth))

  return (
    <div className="fade-in">
      <div className="page-header">📷 사진 앨범</div>
      <div style={{ padding: '0 20px' }}>
        {/* Month selector */}
        {months.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
            {months.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  background: selectedMonth === m ? 'var(--pink)' : 'white',
                  color: selectedMonth === m ? 'white' : 'var(--text)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {m.replace('-', '년 ')}월
              </button>
            ))}
          </div>
        )}

        {/* Photo grid */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {filtered.map((p, i) => (
              <div
                key={i}
                onClick={() => setViewPhoto(p)}
                style={{
                  aspectRatio: '1',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={p.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            {photos.length === 0 ? '다이어리에 사진을 첨부해보세요!' : '이 달의 사진이 없어요'}
          </div>
        )}
      </div>

      {/* Fullscreen view */}
      {viewPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setViewPhoto(null)}
          style={{ background: 'rgba(0,0,0,0.85)', flexDirection: 'column', gap: 16 }}
        >
          <img
            src={viewPhoto.url}
            alt=""
            style={{ maxWidth: '90%', maxHeight: '70vh', borderRadius: 12, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ color: 'white', textAlign: 'center', fontSize: 14, maxWidth: '80%' }}>
            <div style={{ opacity: 0.7, marginBottom: 4 }}>{viewPhoto.date}</div>
            {viewPhoto.content && <div>{viewPhoto.content.substring(0, 100)}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
