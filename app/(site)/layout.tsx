import type { ReactNode } from 'react'
import { getClient } from '@/app/lib/sanityFetch'
import { LAYOUT_QUERY } from '@/sanity/lib/queries'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { BackToTop } from '@/app/components/BackToTop'
import { DraftBanner } from '@/app/components/DraftBanner'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const data = await (await getClient()).fetch(LAYOUT_QUERY)
  return (
    <>
      <Header nav={data?.nav} settings={data?.settings} />
      <main>{children}</main>
      <Footer nav={data?.nav} settings={data?.settings} />
      <BackToTop />
      {/* Renders nothing unless preview is on. */}
      <DraftBanner />
    </>
  )
}
