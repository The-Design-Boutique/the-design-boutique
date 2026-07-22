import type { Metadata } from 'next'
import { Signika } from 'next/font/google'
import './globals.css'

const signika = Signika({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-signika',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Design Boutique',
  description: 'Digital marketing solutions for the AI search era.',
  // Staging build: globally noindex until a go-live SOW says otherwise.
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={signika.variable}>
      <body>{children}</body>
    </html>
  )
}
