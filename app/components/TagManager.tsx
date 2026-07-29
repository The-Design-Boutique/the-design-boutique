import Script from 'next/script'

/**
 * Google Tag Manager, loaded only when there is a container to load.
 *
 * This exists because the Studio has had a "Google Tag Manager ID" field since
 * the beginning and nothing on the site read it. Entering an ID did nothing at
 * all, silently, which is worse than not offering the field: somebody would have
 * pasted a container in, seen no error, and assumed tracking was running.
 *
 * Three deliberate choices.
 *
 * It loads with next/script's afterInteractive strategy rather than in the head.
 * The page renders first and the container arrives once the browser is free.
 * Tag Manager is the usual reason a fast site stops being fast, and this site
 * was taken from 57 to 91 on a phone; loading it eagerly would give a chunk of
 * that back for no benefit, since nothing in a container needs to run before the
 * page is visible.
 *
 * It is off on the preview build unless somebody explicitly asks for it. Loading
 * it here would record our own clicking as if it were real visitors, and that
 * cannot be cleaned out of the figures later. Analytics is one of the few things
 * where a mistake is permanent rather than merely annoying.
 *
 * And it renders nothing at all without an ID, so the default state of this
 * site is no tracking of any kind, which is also the correct default for
 * somebody who has not decided yet.
 */

const IS_PREVIEW = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'true'

export function TagManager({ gtmId, allowOnPreview }: { gtmId?: string; allowOnPreview?: boolean }) {
  const id = gtmId?.trim()
  if (!id) return null
  if (IS_PREVIEW && !allowOnPreview) return null

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`}
      </Script>
      {/*
        The fallback for browsers with JavaScript switched off. It records a page
        view and nothing else, and it is part of Google's own snippet: leaving it
        out is a common way to quietly under-count.
      */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${id}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  )
}
