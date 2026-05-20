import { FileText, ScanSearch, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    icon: FileText,
    title: 'Paste or upload',
    description: 'Add your resume as text or a PDF, then paste the job description.',
  },
  {
    icon: ScanSearch,
    title: 'Instant analysis',
    description: 'We score keyword coverage, skill fit, section relevance, and bullet quality.',
  },
  {
    icon: TrendingUp,
    title: 'Improve and resubmit',
    description: 'Use the targeted feedback to close gaps and rerun until your score climbs.',
  },
]

interface HowItWorksProps {
  className?: string
}

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section aria-labelledby="how-it-works-heading" className={className}>
      <h2
        id="how-it-works-heading"
        className="text-xl font-semibold tracking-tight text-foreground mb-6"
      >
        How it works
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div
              key={step.title}
              className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step {i + 1}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
