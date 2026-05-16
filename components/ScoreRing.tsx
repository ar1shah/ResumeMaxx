'use client'

import { useEffect, useState } from 'react'
import { getScoreColors } from '@/lib/score-colors'

const SIZE = 180
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface ScoreRingProps {
  score: number
}

export function ScoreRing({ score }: ScoreRingProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { hex, label } = getScoreColors(score)
  const offset = CIRCUMFERENCE * (1 - (mounted ? score / 100 : 0))

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Match score: ${score} out of 100`}
      >
        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-muted"
        />
        {/* Score arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={hex}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className="transition-score"
        />
        <text
          x="50%"
          y="50%"
          dy="0.1em"
          textAnchor="middle"
          fill={hex}
          fontSize={42}
          fontWeight={700}
          fontFamily="inherit"
        >
          {score}
        </text>
        <text
          x="50%"
          y="50%"
          dy="1.6em"
          textAnchor="middle"
          fill="currentColor"
          fontSize={12}
          className="fill-muted-foreground"
        >
          / 100
        </text>
      </svg>
      <p className="text-sm font-medium" style={{ color: hex }}>
        {label}
      </p>
    </div>
  )
}
