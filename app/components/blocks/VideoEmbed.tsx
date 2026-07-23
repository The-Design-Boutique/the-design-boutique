'use client'

import { useState } from 'react'
import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Accepts watch/shorts/youtu.be/vimeo URLs and returns an embeddable src. */
function toEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}`
      if (u.pathname.startsWith('/embed/')) return `https://www.youtube.com${u.pathname}`
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}`
    return url
  } catch {
    return null
  }
}

export function VideoEmbed({ block }: { block: any }) {
  const [playing, setPlaying] = useState(false)
  const embed = block.videoUrl ? toEmbed(block.videoUrl) : null
  const poster = block.poster?.asset ? urlFor(block.poster).width(800).url() : undefined

  return (
    <Section settings={block.settings}>
      {block.heading ? (
        <div className="section-heading section-heading--wide"><h2 className="h2">{block.heading}</h2></div>
      ) : null}
      {embed ? (
        <div className="video-frame">
          {playing || !poster ? (
            <iframe
              src={`${embed}?autoplay=1&rel=0&modestbranding=1`}
              title={block.heading || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button type="button" className="video-poster" onClick={() => setPlaying(true)} aria-label="Play video">
              <img src={poster} alt={block.poster?.alt || ''} />
              <span className="video-play" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}
      {block.caption ? <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--tdb-offwhite)' }}>{block.caption}</p> : null}
    </Section>
  )
}
