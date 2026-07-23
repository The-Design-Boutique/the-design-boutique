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
  const bg = block.backgroundImage?.asset ? urlFor(block.backgroundImage).width(2400).quality(80).url() : undefined
  const vid = block.videoUrl ? ytId(block.videoUrl) : null
  const style = bg
    ? { backgroundImage: `linear-gradient(rgba(7,7,7,0.6), rgba(7,7,7,0.85)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <section className="hero bg-black" style={style}>
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
          <div className="hero-ring">
            <div className="video-ring">
              <iframe
                src={`https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&playsinline=1&rel=0&modestbranding=1`}
                title="The Design Boutique"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            <svg className="ring-text" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="ringPath" d="M100,100 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" />
              </defs>
              <text>
                <textPath href="#ringPath">PLAY VIDEO&nbsp;&nbsp;&bull;&nbsp;&nbsp;PLAY VIDEO&nbsp;&nbsp;&bull;&nbsp;&nbsp;PLAY VIDEO&nbsp;&nbsp;&bull;&nbsp;&nbsp;</textPath>
              </text>
            </svg>
          </div>
        ) : null}
      </div>
    </section>
  )
}
