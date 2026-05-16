import { cn } from '@/lib/utils'
import type { BulletFeedback } from '@/types/analysis'

interface BulletAuditProps {
  feedback: BulletFeedback[]
}

export function BulletAudit({ feedback }: BulletAuditProps) {
  if (feedback.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No bullet points detected in the experience section.
      </p>
    )
  }

  const passed = feedback.filter(b => b.passed).length
  const failed = feedback.length - passed

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {passed} of {feedback.length} bullets look strong
        {failed > 0 && ` · ${failed} need attention`}
      </p>
      <ul className="space-y-2">
        {feedback.map((bullet, i) => (
          <li
            key={i}
            className={cn(
              'border-l-2 pl-4 py-2 rounded-r text-sm',
              bullet.passed
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-rose-300 bg-rose-50/50',
            )}
          >
            <p className="text-foreground leading-relaxed">{bullet.text}</p>
            {bullet.issues.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {bullet.issues.map((issue, j) => (
                  <li key={j} className="text-xs text-rose-600 flex items-start gap-1">
                    <span className="mt-px shrink-0">↳</span>
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
