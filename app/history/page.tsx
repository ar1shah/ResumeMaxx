'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getScoreColors } from '@/lib/score-colors'
import type { HistoryEntry } from '@/types/analysis'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('resumemaxx:history')
    setHistory(raw ? JSON.parse(raw) : [])
  }, [])

  return (
    <>
      <SiteHeader />
      <PageShell>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your last {history?.length ?? 0} analyses, stored in this browser.
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
            New analysis
          </Link>
        </div>

        {history === null && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {history?.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">📋</p>
            <p className="font-medium text-foreground">No analyses yet</p>
            <p className="text-sm text-muted-foreground">
              Run your first analysis to see results here.
            </p>
            <Link href="/" className={cn(buttonVariants(), 'mt-2')}>
              Analyze a resume
            </Link>
          </div>
        )}

        {history && history.length > 0 && (
          <ul className="space-y-3">
            {history.map(entry => {
              const { text, bg, border } = getScoreColors(entry.result.overallScore)
              return (
                <li key={entry.id}>
                  <Link href={`/results?id=${entry.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="py-4 flex items-center gap-4">
                        <Badge
                          className={`shrink-0 text-base font-semibold px-3 py-1 ${bg} ${text} ${border} border hover:${bg}`}
                        >
                          {entry.result.overallScore}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.snippet}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </PageShell>
    </>
  )
}
