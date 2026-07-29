import type { ReactNode } from 'react'
import { getClient } from '@/app/lib/sanityFetch'
import { LAYOUT_QUERY } from '@/sanity/lib/queries'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { BackToTop } from '@/app/components/BackToTop'
import { DraftBanner } from '@/app/components/DraftBanner'
import { TagManager } from '@/app/components/TagManager'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const data = await (await getClient()).fetch(LAYOUT_QUERY)
  return (
    <>
      {/* Renders nothing unless a container ID is set in Site Settings. Lives in
          this layout rather than the root one so it never loads inside the
          Studio, which is not a visitor and should not be counted as one. */}
      <TagManager gtmId={data?.settings?.gtmId} allowOnPreview={data?.settings?.gtmOnPreview} />
      <Header nav={data?.nav} settings={data?.settings} />
      <main>{children}</main>
      <Footer nav={data?.nav} settings={data?.settings} />
      <BackToTop />
      {/* Renders nothing unless preview is on. */}
      <DraftBanner />
    </>
  )
}
