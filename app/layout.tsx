import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Automation Frontier Dashboard',
  description: 'Where is AI blocked? A structured look at automation bottlenecks by industry.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink font-mono min-h-screen">
        <div className="fixed inset-x-0 top-0 h-px bg-cyan/30" />
        <Sidebar />
        <main className="min-h-screen md:pl-64">
          {children}
        </main>
      </body>
    </html>
  )
}
