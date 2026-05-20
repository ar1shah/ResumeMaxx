import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreRing } from '@/components/ScoreRing'
import { getScoreColors } from '@/lib/score-colors'
import {
  PREVIEW_SCORE,
  PREVIEW_SECTIONS,
  PREVIEW_KEYWORDS,
  PREVIEW_MATCHED_SKILLS,
  PREVIEW_MISSING_SKILLS,
} from '@/lib/landing-preview-data'

function MiniBar({ label, score }: { label: string; score: number }) {
  const { hex } = getScoreColors(score)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{score}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${score}%`, backgroundColor: hex }}
        />
      </div>
    </div>
  )
}

export function ResultsPreview() {
  return (
    <Card aria-label="Sample analysis report — example data only">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Sample report</CardTitle>
          <Badge variant="secondary" className="text-xs">Example</Badge>
        </div>
        <CardDescription>This is what your results will look like.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score ring */}
        <div className="flex justify-center">
          <ScoreRing score={PREVIEW_SCORE} />
        </div>

        {/* Section scores */}
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Scores by section
          </p>
          {PREVIEW_SECTIONS.map(s => (
            <MiniBar key={s.label} label={s.label} score={s.score} />
          ))}
        </div>

        {/* Skill chips */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Skill match
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PREVIEW_MATCHED_SKILLS.map(s => (
              <Badge
                key={s}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-normal hover:bg-emerald-50"
              >
                ✓ {s}
              </Badge>
            ))}
            {PREVIEW_MISSING_SKILLS.map(s => (
              <Badge
                key={s}
                className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-normal hover:bg-rose-50"
              >
                ✗ {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Missing keywords */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Missing keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PREVIEW_KEYWORDS.map(kw => (
              <Badge key={kw} variant="secondary" className="text-xs font-normal">
                {kw}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-4">
          Your real report also includes a section chart, full skill list, and bullet-point audit.
        </p>
      </CardContent>
    </Card>
  )
}
