import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HomeHero() {
  return (
    <div className="py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
          See how well your{' '}
          <span className="text-primary">resume matches</span>{' '}
          this job
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Paste your resume and a job description to get an instant match score,
          missing keywords, skill gaps, and bullet-point feedback — in seconds.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#analyze"
            className={cn(buttonVariants({ size: 'lg' }), 'px-8')}
          >
            Analyze my resume
          </a>
          <Link
            href="/history"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'text-muted-foreground',
            )}
          >
            View past analyses
          </Link>
        </div>
      </div>
    </div>
  )
}
