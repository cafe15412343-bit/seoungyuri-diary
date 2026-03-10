import { useEffect, useState } from 'react'

export default function HeartAnimation({ trigger }) {
  const [hearts, setHearts] = useState([])

  useEffect(() => {
    if (!trigger) return
    const newHearts = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      left: 30 + Math.random() * 40,
      delay: Math.random() * 0.5,
      size: 16 + Math.random() * 20,
    }))
    setHearts(newHearts)
    const t = setTimeout(() => setHearts([]), 2000)
    return () => clearTimeout(t)
  }, [trigger])

  if (!hearts.length) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
      {hearts.map(h => (
        <div
          key={h.id}
          className="floating-heart"
          style={{
            left: `${h.left}%`,
            animationDelay: `${h.delay}s`,
            fontSize: h.size,
          }}
        >
          💕
        </div>
      ))}
    </div>
  )
}
