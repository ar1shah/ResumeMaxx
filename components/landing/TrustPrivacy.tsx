import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustPrivacyProps {
  className?: string
}

export function TrustPrivacy({ className }: TrustPrivacyProps) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border border-border bg-muted/40 px-5 py-4',
        className,
      )}
    >
      <ShieldCheck
        size={18}
        className="mt-0.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Your data stays in your browser.</span>{' '}
          Analyses run when you submit; history is saved only to this device&apos;s{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">localStorage</code>.
          Nothing is uploaded to a ResumeMaxx account.
        </p>
        <p>
          Clearing browser data removes your history. Use a private window if you
          don&apos;t want entries saved.
        </p>
      </div>
    </div>
  )
}
