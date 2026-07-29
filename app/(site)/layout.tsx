import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { getClient } from '@/app/lib/sanityFetch'
import { LAYOUT_QUERY } from '@/sanity/lib/queries'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { BackToTop } from '@/app/components/BackToTop'
import { DraftBanner } from '@/app/components/DraftBanner'
import { TagManager } from '@/app/components/TagManager'
import { PhoneClickTracker } from '@/app/components/PhoneClickTracker'
import { ConsentScripts } from '@/app/components/ConsentScripts'
import { ConsentBanner } from '@/app/components/ConsentBanner'
import { FormHygiene } from '@/app/components/FormHygiene'
import { isHealthIntentPath } from '@/app/lib/consent'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const data = await (await getClient()).fetch(LAYOUT_QUERY)
  const privacy = data?.settings?.privacy

  // Set by the proxy, because a server component cannot see the path it is
  // rendering. Absent only when the proxy did not run, in which case no page is
  // treated as health intent, which is the honest reading of "we do not know".
  const pathname = (await headers()).get('x-pathname') || ''
  const hardBlock = isHealthIntentPath(pathname, privacy?.healthIntentPaths)

  return (
    <>
      {/*
        First on the page, and that ordering is the whole feature. These inline
        scripts tell Google's tags to hold off, then replace the browser's
        network primitives, so by the time anything else runs a tracker the
        visitor has not agreed to cannot reach the network at all. Anything
        placed above this would be outside the gate.
      */}
      <ConsentScripts privacy={privacy} hardBlock={hardBlock} />
      {/* Renders nothing unless a container ID is set in Site Settings. Lives in
          this layout rather than the root one so it never loads inside the
          Studio, which is not a visitor and should not be counted as one.
          Suppressed outright on a page that collects health information: there
          the container is never loaded, rather than loaded and held back. */}
      {hardBlock ? null : (
        <TagManager gtmId={data?.settings?.gtmId} allowOnPreview={data?.settings?.gtmOnPreview} />
      )}
      <Header nav={data?.nav} settings={data?.settings} />
      <main>{children}</main>
      <Footer nav={data?.nav} settings={data?.settings} />
      <BackToTop />
      {/* One delegated listener, so numbers added later are caught too. */}
      <PhoneClickTracker />
      {/* Marketing opt-ins must never arrive pre-ticked. */}
      <FormHygiene />
      {/* The banner and the preference dialog. The blocking above does not
          depend on either of them having rendered. */}
      {privacy?.enabled !== false ? (
        <ConsentBanner
          heading={privacy?.heading}
          body={privacy?.body}
          privacyPolicyUrl={privacy?.privacyPolicyUrl}
          cookiePolicyUrl={privacy?.cookiePolicyUrl}
        />
      ) : null}
      {/* Renders nothing unless preview is on. */}
      <DraftBanner />
    </>
  )
}
