'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'hover:text-foreground transition-colors',
        active ? 'text-foreground font-medium' : 'text-muted-foreground',
      )}
    >
      {children}
    </Link>
  )
}
