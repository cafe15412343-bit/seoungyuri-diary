import { useState, useEffect } from 'react'
import { getSavedEffect } from '../utils/themes'

const PARTICLE_COUNT = 12

const EFFECT_EMOJIS = {
  cherry: '🌸',
  snow: '❄️',
  hearts: '💕',
  stars: '⭐',
  leaves: '🍂',
}

export default function CherryBlossoms() {
  const [effect, setEffect] = useState(getSavedEffect)

  // Listen for effect changes
  useEffect(() => {
    const check = () => setEffect(getSavedEffect())
    window.addEventListener('storage', check)
    // Also check periodically for same-tab changes
    const interval = setInterval(check, 1000)
    return () => { window.removeEventListener('storage', check); clearInterval(interval) }
  }, [])

  if (effect === 'none' || !EFFECT_EMOJIS[effect]) return null

  const emoji = EFFECT_EMOJIS[effect]

  return (
    <div className="cherry-blossoms" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <div
          key={i}
          className="petal"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
            fontSize: `${10 + Math.random() * 14}px`,
            opacity: 0.3 + Math.random() * 0.3,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  )
}
