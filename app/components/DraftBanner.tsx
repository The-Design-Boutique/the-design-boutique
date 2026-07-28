import { draftMode } from 'next/headers'

/**
 * Says so, unmistakably, when the page being viewed is not the published one.
 *
 * Preview is a cookie, so it follows you from page to page and outlives the
 * reason you turned it on. Without a permanent marker it is genuinely easy to
 * spend twenty minutes reporting bugs against a draft, or worse, to look at a
 * draft and believe the site is live with it.
 *
 * Deliberately fixed to the bottom rather than the top: the header is Laney's
 * design and the point of a preview is to see that design undisturbed.
 */

export async function DraftBanner({ path }: { path?: string }) {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return null

  const back = `/api/draft/disable${path ? `?return=${encodeURIComponent(path)}` : ''}`

  return (
    <div
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: 2147483647,
        background: '#1f2933',
        color: '#fff',
        font: '500 14px/1.4 system-ui, sans-serif',
        padding: '10px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <span>
        You are previewing unpublished changes. Visitors still see the published page.
      </span>
      <a href={back} style={{ color: '#ffd166', textDecoration: 'underline' }}>
        Stop previewing
      </a>
    </div>
  )
}
