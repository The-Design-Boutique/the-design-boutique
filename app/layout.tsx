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
  // TEMPORARY: indexing enabled for the client sneak-peek Lighthouse (SEO 100).
  // RESTORE to `{ index: false, follow: false }` before any go-live per the staging-noindex rule.
  robots: { index: true, follow: true },
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
