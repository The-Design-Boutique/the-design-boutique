'use client'

import { useEffect, useState } from 'react'

/**
 * The looping video in the homepage hero, loaded after the page has rendered
 * rather than as part of it.
 *
 * Embedding YouTube directly costs about 840KB of Google JavaScript, and
 * because the hero is the first thing on the page that download used to compete
 * with the page's own rendering. On a phone it was the difference between the
 * main content appearing in about ten seconds and appearing in about two.
 *
 * Nothing about the design changes. The frame reserves its space immediately so
 * the layout never shifts, the poster image fills it, and the video swaps in
 * once the browser is idle. Because it is muted, looping wallpaper, arriving a
 * moment later is not something a visitor can notice.
 */

export function HeroVideo({ videoId, poster }: { videoId: string; poster?: string }) {
  const [load, setLoad] = useState(false)

  useEffect(() => {
    // Wait for the browser to finish the work that actually matters first.
    // requestIdleCallback is not in every browser, hence the timeout fallback.
    const idle = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }).requestIdleCallback

    if (idle) {
      const handle = idle(() => setLoad(true), { timeout: 3000 })
      return () => {
        const cancel = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback
        cancel?.(handle)
      }
    }
    const t = setTimeout(() => setLoad(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="hero-video-frame">
      {load ? (
        <iframe
          // The no-cookie host serves the same player without setting tracking
          // cookies before a visitor has chosen to watch anything.
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&playsinline=1&rel=0&modestbranding=1`}
          title="The Design Boutique"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : poster ? (
        // Holds the frame until the video arrives, so nothing moves on the page.
        <img className="hero-video-poster" src={poster} alt="" aria-hidden="true" />
      ) : null}
    </div>
  )
}
