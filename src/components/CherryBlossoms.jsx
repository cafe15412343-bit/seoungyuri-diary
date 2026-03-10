import { useEffect, useRef } from 'react'

const PETAL_COUNT = 15

export default function CherryBlossoms() {
  return (
    <div className="cherry-blossoms" aria-hidden="true">
      {Array.from({ length: PETAL_COUNT }, (_, i) => (
        <div
          key={i}
          className="petal"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
            fontSize: `${10 + Math.random() * 14}px`,
            opacity: 0.4 + Math.random() * 0.4,
          }}
        >
          🌸
        </div>
      ))}
    </div>
  )
}
