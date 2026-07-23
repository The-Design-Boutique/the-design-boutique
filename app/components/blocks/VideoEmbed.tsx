import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
function toEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}`
    return url
  } catch {
    return null
  }
}

export function VideoEmbed({ block }: { block: any }) {
  const embed = block.videoUrl ? toEmbed(block.videoUrl) : null
  return (
    <Section settings={block.settings} container="narrow">
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      {embed ? (
        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
          <iframe
            src={embed}
            title={block.heading || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      ) : null}
      {block.caption ? <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--tdb-offwhite)' }}>{block.caption}</p> : null}
    </Section>
  )
}
