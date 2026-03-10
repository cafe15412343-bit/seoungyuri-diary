import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db, storage } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function Diary() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [diaries, setDiaries] = useState([])
  const [showWrite, setShowWrite] = useState(false)
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [photo, setPhoto] = useState(null)
  const [uploading, setUploading] = useState(false)

  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.names?.[user.uid] || '나'
  const partnerName = couple?.names?.[partnerUid] || '상대방'
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

  const handleSubmit = async () => {
    if (!content.trim()) return
    setUploading(true)
    try {
      let photoURL = null
      if (photo) {
        const storageRef = ref(storage, `couples/${coupleId}/diary/${Date.now()}_${photo.name}`)
        await uploadBytes(storageRef, photo)
        photoURL = await getDownloadURL(storageRef)
      }
      await addDoc(collection(db, 'couples', coupleId, 'diaries'), {
        content: content.trim(),
        date,
        authorUid: user.uid,
        photoURL,
        createdAt: new Date()
      })
      setContent('')
      setDate(new Date().toISOString().split('T')[0])
      setPhoto(null)
      setShowWrite(false)
    } catch (e) {
      alert('저장에 실패했어요 😢')
    }
    setUploading(false)
  }

  const handleDelete = async (id) => {
    if (confirm('정말 삭제할까요?')) {
      await deleteDoc(doc(db, 'couples', coupleId, 'diaries', id))
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📔 다이어리</span>
        <button
          onClick={() => setShowWrite(!showWrite)}
          style={{ fontSize: 14, background: 'var(--pink)', color: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 500 }}
        >
          {showWrite ? '✕ 닫기' : '✏️ 글쓰기'}
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Write Form */}
        {showWrite && (
          <div className="card fade-in" style={{ borderLeft: '4px solid var(--pink)' }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field"
              style={{ marginBottom: 12 }}
            />
            <textarea
              className="input-field"
              placeholder="오늘의 이야기를 적어보세요 💕"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              style={{ marginBottom: 12, resize: 'none' }}
            />
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--pink-bg)', borderRadius: 20, fontSize: 14, cursor: 'pointer', color: 'var(--pink)' }}>
                📷 사진 첨부
                <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} style={{ display: 'none' }} />
              </label>
              {photo && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-light)' }}>{photo.name}</span>}
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={uploading || !content.trim()}>
              {uploading ? '저장 중...' : '💌 저장하기'}
            </button>
          </div>
        )}

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--pink-light)' }} />
          {diaries.map(d => (
            <div key={d.id} className="card fade-in" style={{ position: 'relative', marginLeft: 8 }}>
              <div style={{
                position: 'absolute', left: -28, top: 20,
                width: 14, height: 14, borderRadius: '50%',
                background: d.authorUid === user.uid ? 'var(--pink)' : 'var(--coral)',
                border: '3px solid white', boxShadow: 'var(--shadow)'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: d.authorUid === user.uid ? 'var(--pink)' : 'var(--coral)' }}>
                    {d.authorUid === user.uid ? `${myAnimal} ${myName} 💗` : `${partnerAnimal} ${partnerName} 💛`}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>{d.date}</span>
                </div>
                {d.authorUid === user.uid && (
                  <button onClick={() => handleDelete(d.id)} style={{ background: 'none', fontSize: 12, color: 'var(--text-light)' }}>🗑</button>
                )}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{d.content}</p>
              {d.photoURL && (
                <img src={d.photoURL} alt="" style={{ marginTop: 12, width: '100%', borderRadius: 'var(--radius-sm)', maxHeight: 300, objectFit: 'cover' }} />
              )}
            </div>
          ))}
          {diaries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              첫 번째 다이어리를 작성해보세요!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
