'use client'

import { useCallback, useState } from 'react'
import { useClient, useCurrentUser, type DocumentActionComponent, type DocumentActionProps } from 'sanity'
import { createPreviewSecret } from '@sanity/preview-url-secret/create-secret'

/**
 * "View page": opens this page in a new tab, showing unpublished edits.
 *
 * The Studio also carries the Presentation tool, which shows the site in a panel
 * beside the document. Both exist because they answer different questions, but
 * this is the one people reach for. The site's layout is built for 1200 to
 * 1440 pixels and a panel next to a document list is nowhere near that, so the
 * embedded view shows a squeezed version of the design. For "does this look
 * right", a real tab at real width is the only honest answer.
 *
 * It opens in preview mode, so a draft that has never been published is
 * visible. That is the whole point: looking at the published version is what the
 * live site is for.
 *
 * The link is signed by Sanity rather than carrying a shared secret. A secret in
 * a URL gets pasted into chat messages, and anyone holding it could read
 * unpublished work.
 */

/** Where each kind of document lives, mirroring the catch-all route. */
const PATH_PREFIX: Record<string, string> = { page: '', post: '', goldEvent: 'gold/', client: 'portfolio/' }

function pathFor(type: string, slug?: string): string | null {
  if (!slug) return null
  const prefix = PATH_PREFIX[type]
  if (prefix === undefined) return null
  return slug === 'home' ? '/' : `/${prefix}${slug}`
}

export const viewPageAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient({ apiVersion: '2025-02-19' })
  const user = useCurrentUser()
  const [busy, setBusy] = useState(false)

  const doc = (props.draft || props.published) as { slug?: { current?: string } } | null
  const path = pathFor(props.type, doc?.slug?.current)

  const open = useCallback(async () => {
    if (!path) return
    setBusy(true)
    try {
      const { secret } = await createPreviewSecret(
        client,
        'sanity.studio',
        typeof window === 'undefined' ? '' : window.location.origin,
        user?.id,
      )
      const url = new URL('/api/draft/enable', window.location.origin)
      url.searchParams.set('sanity-preview-secret', secret)
      url.searchParams.set('sanity-preview-pathname', path)
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
    } catch {
      // Falling back to the plain address is better than doing nothing: the
      // published version still opens, it simply will not show unpublished
      // edits.
      window.open(path, '_blank', 'noopener,noreferrer')
    } finally {
      setBusy(false)
    }
  }, [client, path, user?.id])

  // A document with no address has nothing to show.
  if (!path) return null

  return {
    label: busy ? 'Opening' : 'View page',
    title: 'Open this page in a new tab, including any unpublished changes',
    disabled: busy,
    onHandle: () => {
      open()
      props.onComplete()
    },
  }
}
