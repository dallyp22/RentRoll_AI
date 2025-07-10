import { ReactNode } from 'react'
import { AppShell } from './AppShell'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return <AppShell>{children}</AppShell>
} 