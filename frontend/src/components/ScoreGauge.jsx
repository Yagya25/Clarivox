import { useEffect, useRef, useState } from 'react'
import './ScoreGauge.css'

export default function ScoreGauge({ score, maxScore = 10, label, delay = 0 }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const circleRef = useRef(null)

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const percentage = animatedScore / maxScore
  const offset = circumference - (percentage * circumference)

  // Get color based on score
  const getColor = (s) => {
    if (s >= 8) return '#10b981'
    if (s >= 6) return '#6c5ce7'
    if (s >= 4) return '#f59e0b'
    return '#ef4444'
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500
      const start = performance.now()

      const animate = (time) => {
        const elapsed = time - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setAnimatedScore(+(score * eased).toFixed(1))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timer)
  }, [score, delay])

  const color = getColor(score)

  return (
    <div className="score-gauge" style={{ animationDelay: `${delay}ms` }}>
      <div className="score-gauge__circle-wrapper">
        <svg className="score-gauge__svg" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          {/* Score circle */}
          <circle
            ref={circleRef}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`,
              transition: 'stroke-dashoffset 0.1s ease'
            }}
          />
        </svg>
        <div className="score-gauge__value" style={{ color }}>
          {animatedScore.toFixed(1)}
        </div>
      </div>
      <div className="score-gauge__label">{label}</div>
    </div>
  )
}
