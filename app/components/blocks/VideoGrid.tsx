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

/** The click-to-play frame shared by both layouts. */
function VideoFrame({ item, rows }: { item: any; rows?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const embed = item.videoUrl ? toEmbed(item.videoUrl) : null
  const poster = item.poster?.asset ? urlFor(item.poster).width(rows ? 1100 : 700).url() : undefined
  return (
    <div className={`video-grid-frame${rows ? ' video-grid-frame--wide' : ''}`}>
      {playing && embed ? (
        <iframe
          src={`${embed}?autoplay=1&rel=0&modestbranding=1`}
          title={item.name || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="video-poster" onClick={() => setPlaying(true)} aria-label={`Play ${item.name || 'video'}`} disabled={!embed}>
          {poster ? <img src={poster} alt={item.poster?.alt || item.name || ''} loading="lazy" /> : null}
          <span className="video-play" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function VideoCard({ item }: { item: any }) {
  return (
    <figure className="video-grid-item">
      <VideoFrame item={item} />
      {item.name ? <figcaption className="video-grid-name">{item.name}</figcaption> : null}
    </figure>
  )
}

/** Video on the left, name / role / category on the right (the Testimonials page). */
function VideoRow({ item }: { item: any }) {
  return (
    <div className="video-row">
      <VideoFrame item={item} rows />
      <div className="video-row-details">
        {item.name ? <h4 className="video-row-name">{item.name}</h4> : null}
        {item.role ? <p className="video-row-role">{item.role}</p> : null}
        {item.category ? <p className="video-row-category">{item.category}</p> : null}
      </div>
    </div>
  )
}

export function VideoGrid({ block }: { block: any }) {
  const videos: any[] = Array.isArray(block.videos) ? block.videos : []
  return (
    <Section settings={block.settings}>
      {block.eyebrow || block.heading ? (
        <div className="section-heading section-heading--wide">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
        </div>
      ) : null}
      {block.layout === 'rows' ? (
        <div className="video-rows">
          {videos.map((v, i) => (
            <VideoRow key={i} item={v} />
          ))}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v, i) => (
            <VideoCard key={i} item={v} />
          ))}
        </div>
      )}
    </Section>
  )
}
