'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface KeywordChipsProps {
  keywords: string[]
}

export function KeywordChips({ keywords }: KeywordChipsProps) {
  const [copied, setCopied] = useState(false)

  if (keywords.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No missing keywords — great coverage!
      </p>
    )
  }

  async function copyAll() {
    await navigator.clipboard.writeText(keywords.join(', '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {keywords.length} missing from your resume
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAll}
          aria-label="Copy all missing keywords to clipboard"
        >
          {copied ? 'Copied!' : 'Copy all'}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map(kw => (
          <Badge key={kw} variant="secondary" className="text-xs font-normal">
            {kw}
          </Badge>
        ))}
      </div>
    </div>
  )
}
