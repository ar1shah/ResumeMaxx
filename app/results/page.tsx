'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { PageShell } from '@/components/layout/PageShell'
import { ScoreRing } from '@/components/ScoreRing'
import { SectionChart } from '@/components/SectionChart'
import { KeywordChips } from '@/components/KeywordChips'
import { SkillGap } from '@/components/SkillGap'
import { BulletAudit } from '@/components/BulletAudit'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import type { HistoryEntry } from '@/types/analysis'

function ResultSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

function ResultsContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [entry, setEntry] = useState<HistoryEntry | null | 'not-found'>(null)

  useEffect(() => {
    if (!id) { setEntry('not-found'); return }
    const raw = localStorage.getItem('resumemaxx:history')
    if (!raw) { setEntry('not-found'); return }
    const history: HistoryEntry[] = JSON.parse(raw)
    const found = history.find(e => e.id === id)
    setEntry(found ?? 'not-found')
  }, [id])

  if (entry === null) return <ResultSkeleton />

  if (entry === 'not-found') return (
    <div className="text-center py-20 space-y-4">
      <p className="text-lg font-medium text-foreground">Analysis not found</p>
      <p className="text-sm text-muted-foreground">
        This result may have been cleared from your browser storage.
      </p>
      <Link href="/" className={cn(buttonVariants())}>Start a new analysis</Link>
    </div>
  )

  const { result } = entry

  return (
    <PageShell className="space-y-6">
      {/* Header band */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your results</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date(result.createdAt).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/history" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            View history
          </Link>
          <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
            New analysis
          </Link>
        </div>
      </div>

      <Separator />

      {/* Score + section scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center justify-center p-6">
          <ScoreRing score={result.overallScore} />
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score by section</CardTitle>
            <CardDescription>How well each part of your resume aligns with the JD</CardDescription>
          </CardHeader>
          <CardContent>
            <SectionChart sections={result.sectionScores} />
          </CardContent>
        </Card>
      </div>

      {/* Skill gap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Skill match</CardTitle>
          <CardDescription>
            {result.matchedSkills.length} of {result.jdSkillCount} skills from the JD appear in your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkillGap matched={result.matchedSkills} missing={result.missingSkills} />
        </CardContent>
      </Card>

      {/* Missing keywords */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Missing keywords</CardTitle>
          <CardDescription>High-frequency JD terms not found in your resume, ranked by importance</CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordChips keywords={result.missingKeywords} />
        </CardContent>
      </Card>

      {/* Bullet audit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bullet-point audit</CardTitle>
          <CardDescription>
            Checking for action verbs, measurable outcomes, and passive phrasing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulletAudit feedback={result.bulletFeedback} />
        </CardContent>
      </Card>
    </PageShell>
  )
}

export default function ResultsPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<PageShell><ResultSkeleton /></PageShell>}>
        <ResultsContent />
      </Suspense>
    </>
  )
}
