import { Badge } from '@/components/ui/badge'

interface SkillGapProps {
  matched: string[]
  missing: string[]
}

export function SkillGap({ matched, missing }: SkillGapProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-emerald-700">
          Matched skills — {matched.length}
        </p>
        {matched.length === 0 ? (
          <p className="text-sm text-muted-foreground">None detected</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {matched.map(s => (
              <Badge
                key={s}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-normal hover:bg-emerald-50"
              >
                ✓ {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-rose-700">
          Missing skills — {missing.length}
        </p>
        {missing.length === 0 ? (
          <p className="text-sm text-muted-foreground">You're fully covered!</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {missing.map(s => (
              <Badge
                key={s}
                className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-normal hover:bg-rose-50"
              >
                ✗ {s}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
