import { useState, useEffect, useContext, useRef } from 'react'
import { AppContext } from '../App'
import { db, storage } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Compress image before upload for speed
function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader()
      reader.onerror = () => resolve(file) // fallback to original
      reader.onload = (e) => {
        const img = new window.Image()
        img.onerror = () => resolve(file) // fallback to original
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            let { width, height } = img
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob((blob) => {
              resolve(blob || file) // fallback if blob is null
            }, 'image/jpeg', quality)
          } catch {
            resolve(file)
          }
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch {
      resolve(file) // fallback to original
    }
  })
}

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

      if (photos.length > 0) {
        // Try uploading photos - convert to base64 data URLs as fallback
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          try {
            // Try Firebase Storage upload
            let fileToUpload
            try {
              fileToUpload = await compressImage(photo)
            } catch {
              fileToUpload = photo
            }
            const fileName = `${Date.now()}_${i}_${Math.random().toString(36).slice(2)}.jpg`
            const storageRef = ref(storage, `couples/${coupleId}/diary/${fileName}`)
            await uploadBytes(storageRef, fileToUpload)
            const url = await getDownloadURL(storageRef)
            photoURLs.push(url)
          } catch (uploadErr) {
            console.error('Storage 업로드 실패, base64 fallback:', uploadErr)
            // Fallback: save as base64 data URL directly in Firestore
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = (e) => {
                // Compress via canvas for smaller size
                const img = new window.Image()
                img.onload = () => {
                  const canvas = document.createElement('canvas')
                  let w = img.width, h = img.height
                  const max = 800
                  if (w > max) { h = (h * max) / w; w = max }
                  canvas.width = w; canvas.height = h
                  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                  resolve(canvas.toDataURL('image/jpeg', 0.5))
                }
                img.onerror = () => resolve(null)
                img.src = e.target.result
              }
              reader.onerror = () => resolve(null)
              reader.readAsDataURL(photo)
            })
            if (dataUrl) photoURLs.push(dataUrl)
          }
        }
      }

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
