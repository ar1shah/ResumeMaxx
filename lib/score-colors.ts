export interface ScoreColors {
  text: string
  bg: string
  border: string
  hex: string
  label: string
}

export function getScoreColors(score: number): ScoreColors {
  if (score >= 75) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      hex: '#047857',
      label: 'Strong match',
    }
  }
  if (score >= 50) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      hex: '#b45309',
      label: 'Room to improve',
    }
  }
  return {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    hex: '#be123c',
    label: 'Low match',
  }
}
