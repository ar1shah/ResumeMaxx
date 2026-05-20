import { SiteHeader } from '@/components/layout/SiteHeader'
import { PageShell } from '@/components/layout/PageShell'
import { UploadForm } from '@/components/UploadForm'
import { HomeHero } from '@/components/landing/HomeHero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ResultsPreview } from '@/components/landing/ResultsPreview'
import { TrustPrivacy } from '@/components/landing/TrustPrivacy'
import { Separator } from '@/components/ui/separator'

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <PageShell>
        {/* Hero + preview: two-column on lg, stacked on small */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
          <HomeHero />
          {/* Preview shown beside hero on large screens */}
          <div className="hidden lg:block">
            <ResultsPreview />
          </div>
        </div>

        {/* Preview full-width between hero and form on small/medium screens */}
        <div className="mt-8 lg:hidden">
          <ResultsPreview />
        </div>

        <Separator className="mt-12" />

        <section id="analyze" className="scroll-mt-20 mt-10 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Start your analysis
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste or upload your resume and the job description below.
            </p>
          </div>
          <UploadForm />
        </section>

        <HowItWorks className="mt-14" />

        <TrustPrivacy className="mt-10 mb-4" />
      </PageShell>
    </>
  )
}
