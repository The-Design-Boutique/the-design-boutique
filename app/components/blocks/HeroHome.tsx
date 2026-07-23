import { CtaLink } from '../CtaLink'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
function ytId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

export function HeroHome({ block }: { block: any }) {
  const bg = block.backgroundImage?.asset ? urlFor(block.backgroundImage).width(2560).quality(85).url() : undefined
  const poster = block.posterImage?.asset ? urlFor(block.posterImage).width(320).url() : undefined
  const vid = block.videoUrl ? ytId(block.videoUrl) : null
  const style = bg
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(7,7,7,0.28) 0%, rgba(7,7,7,0.12) 45%, rgba(7,7,7,0.60) 100%), url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  return (
    <section className="hero" style={style}>
      <div className="container hero-grid">
        <div className="hero-copy">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          <h1 className="h1">{block.headline}</h1>
          {block.subhead ? <p className="lead" style={{ marginTop: '1.25rem', whiteSpace: 'pre-line' }}>{block.subhead}</p> : null}
          {Array.isArray(block.ctas) && block.ctas.length ? (
            <div className="btn-row" style={{ marginTop: '1.75rem' }}>
              {block.ctas.map((c: any, i: number) => <CtaLink key={i} cta={c} variant={i === 0 ? 'accent' : 'outline'} />)}
            </div>
          ) : null}
        </div>

        {vid ? (
          <div className="hero-video">
            <div className="hero-video-frame">
              <iframe
                src={`https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&playsinline=1&rel=0&modestbranding=1`}
                title="The Design Boutique"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            <a className="play-badge" href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer" aria-label="Play video">
              {poster ? <img className="play-badge-photo" src={poster} alt="" /> : null}
              <span className="play-badge-triangle" aria-hidden="true" />
              <svg className="ring-text" viewBox="0 0 200 200" aria-hidden="true">
                <defs>
                  <path id="ringPath" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
                </defs>
                <text>
                  <textPath href="#ringPath">PLAY VIDEO&nbsp;&nbsp;&bull;&nbsp;&nbsp;PLAY VIDEO&nbsp;&nbsp;&bull;&nbsp;&nbsp;PLAY VIDEO&nbsp;&nbsp;&bull;&nbsp;&nbsp;</textPath>
                </text>
              </svg>
            </a>
          </div>
        ) : null}
      </div>
    </section>
  )
}
