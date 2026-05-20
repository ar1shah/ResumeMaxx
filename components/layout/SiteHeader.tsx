import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { NavLink } from '@/components/layout/NavLink'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Resume<span className="text-primary">Maxx</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <NavLink href="/">Analyze</NavLink>
          <NavLink href="/history">History</NavLink>
        </nav>
      </div>
      <Separator />
    </header>
  )
}
