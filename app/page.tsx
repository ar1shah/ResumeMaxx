import { SiteHeader } from '@/components/layout/SiteHeader'
import { PageShell } from '@/components/layout/PageShell'
import { UploadForm } from '@/components/UploadForm'

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <PageShell>
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            How well does your resume match?
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Paste your resume and a job description to get an instant score,
            missing keywords, skill gaps, and bullet-point feedback.
          </p>
        </div>
        <UploadForm />
      </PageShell>
    </>
  )
}
