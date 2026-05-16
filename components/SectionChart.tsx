'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { SectionScore } from '@/types/analysis'
import { getScoreColors } from '@/lib/score-colors'

interface SectionChartProps {
  sections: SectionScore[]
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function SectionChart({ sections }: SectionChartProps) {
  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No sections detected in the resume.
      </p>
    )
  }

  const data = sections.map(s => ({
    name: capitalize(s.section),
    score: s.score,
    hex: getScoreColors(s.score).hex,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 48, 120)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
        barCategoryGap="30%"
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 13, fill: 'hsl(var(--foreground) / 0.8)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          formatter={(value) => [`${value ?? 0}`, 'Score']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            fontSize: 13,
          }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12 }}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.hex} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
