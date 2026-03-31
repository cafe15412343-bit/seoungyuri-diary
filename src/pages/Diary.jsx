import { useState, useEffect, useContext, useRef } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { compressForDiary } from '../utils/imageResize'

export default function Diary() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [diaries, setDiaries] = useState([])
  const [showWrite, setShowWrite] = useState(false)
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState([]) // multiple photos
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.userNames?.[user.uid]?.myName || couple?.names?.[user.uid] || '나'
  const partnerName = couple?.userNames?.[user.uid]?.partnerName || (partnerUid ? couple?.names?.[partnerUid] : null) || '상대방'
  const myAnimal = couple?.animals?.[user.uid] || ''
  const partnerAnimal = couple?.animals?.[partnerUid] || ''

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'diaries'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setDiaries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setPhotos(prev => [...prev, ...files])
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotoPreviews(prev => [...prev, ev.target.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!content.trim() && photos.length === 0) return
    setUploading(true)
    try {
      const photoURLs = []

      for (let i = 0; i < photos.length; i++) {
        try {
          const dataUrl = await compressForDiary(photos[i])
          photoURLs.push(dataUrl)
        } catch (err) {
          console.error('이미지 압축 실패:', err)
          // 압축 실패 시 미리보기 사용
          if (photoPreviews[i]) {
            photoURLs.push(photoPreviews[i])
          }
        }
      }

      // 글 저장 (사진 URL 있으면 포함, 없으면 텍스트만)
      await addDoc(collection(db, 'couples', coupleId, 'diaries'), {
        content: content.trim(),
        date: new Date().toISOString().split('T')[0],
        authorUid: user.uid,
        photoURL: photoURLs[0] || null,
        photoURLs: photoURLs.length > 0 ? photoURLs : null,
        createdAt: new Date()
      })
      setContent('')
      setPhotos([])
      setPhotoPreviews([])
      setShowWrite(false)
    } catch (e) {
      console.error('저장 실패:', e)
      alert('저장에 실패했어요 😢\n' + (e?.code || '') + ': ' + (e?.message || ''))
    }
    setUploading(false)
  }

  const handleDelete = async (id) => {
    if (confirm('정말 삭제할까요?')) {
      await deleteDoc(doc(db, 'couples', coupleId, 'diaries', id))
    }
  }

  const formatTime = (d) => {
    if (!d.createdAt) return d.date
    const ts = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)
    const month = ts.getMonth() + 1
    const day = ts.getDate()
    const hours = ts.getHours()
    const mins = String(ts.getMinutes()).padStart(2, '0')
    const ampm = hours < 12 ? '오전' : '오후'
    const h = hours % 12 || 12
    return `${month}/${day} ${ampm} ${h}:${mins}`
  }

  const getAllPhotos = (d) => {
    if (d.photoURLs && d.photoURLs.length > 0) return d.photoURLs
    if (d.photoURL) return [d.photoURL]
    return []
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📖 우리의 기록</span>
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
            <textarea
              className="input-field"
              placeholder="오늘의 이야기를 적어보세요 💕"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              style={{ marginBottom: 12, resize: 'none' }}
            />

            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: photoPreviews.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: 8,
                marginBottom: 12,
              }}>
                {photoPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{
                      width: '100%',
                      height: photoPreviews.length === 1 ? 200 : 120,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                    }} />
                    <button
                      onClick={() => removePhoto(i)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        borderRadius: '50%', width: 24, height: 24,
                        fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 16px', background: 'var(--pink-bg)', borderRadius: 20,
                  fontSize: 14, cursor: 'pointer', color: 'var(--pink)', fontWeight: 500,
                }}
              >
                📷 사진 추가
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotos}
                style={{ display: 'none' }}
              />
              {photos.length > 0 && (
                <span style={{ fontSize: 13, color: 'var(--text-light)', alignSelf: 'center' }}>
                  {photos.length}장 선택됨
                </span>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={uploading || (!content.trim() && photos.length === 0)}
            >
              {uploading ? '업로드 중... 📤' : '💌 올리기'}
            </button>
          </div>
        )}

        {/* Feed - Band style */}
        {diaries.map(d => {
          const dPhotos = getAllPhotos(d)
          return (
            <div key={d.id} className="card fade-in">
              {/* Author header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: d.authorUid === user.uid ? 'var(--pink)' : 'var(--coral)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {d.authorUid === user.uid ? (myAnimal || '💗') : (partnerAnimal || '💛')}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: d.authorUid === user.uid ? 'var(--pink)' : 'var(--coral)' }}>
                      {d.authorUid === user.uid ? myName : partnerName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{formatTime(d)}</div>
                  </div>
                </div>
                {d.authorUid === user.uid && (
                  <button onClick={() => handleDelete(d.id)} style={{ background: 'none', fontSize: 14, color: 'var(--text-light)' }}>🗑</button>
                )}
              </div>

              {/* Content */}
              {d.content && (
                <p style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: dPhotos.length > 0 ? 12 : 0 }}>{d.content}</p>
              )}

              {/* Photos grid */}
              {dPhotos.length === 1 && (
                <img src={dPhotos[0]} alt="" style={{
                  width: '100%', borderRadius: 'var(--radius-sm)',
                  maxHeight: 350, objectFit: 'cover',
                }} />
              )}
              {dPhotos.length > 1 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: dPhotos.length === 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
                  gap: 4,
                }}>
                  {dPhotos.map((url, i) => (
                    <img key={i} src={url} alt="" style={{
                      width: '100%',
                      height: dPhotos.length <= 2 ? 180 : 130,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {diaries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            첫 번째 기록을 남겨보세요!
          </div>
        )}
      </div>
    </div>
  )
}
