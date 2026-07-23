import type { ReactNode } from 'react'
import { client } from '@/sanity/lib/client'
import { LAYOUT_QUERY } from '@/sanity/lib/queries'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { BackToTop } from '@/app/components/BackToTop'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const data = await client.fetch(LAYOUT_QUERY)
  return (
    <>
      <Header nav={data?.nav} settings={data?.settings} />
      <main>{children}</main>
      <Footer nav={data?.nav} settings={data?.settings} />
      <BackToTop />
    </>
  )
}
