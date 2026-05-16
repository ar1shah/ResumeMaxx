import { cn } from '@/lib/utils'

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn('mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12', className)}>
      {children}
    </main>
  )
}
