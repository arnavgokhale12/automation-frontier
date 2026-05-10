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
      <body className="bg-bg text-[#cccccc] font-mono flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
