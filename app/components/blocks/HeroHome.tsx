import { CtaLink } from '../CtaLink'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function HeroHome({ block }: { block: any }) {
  const bg = block.backgroundImage?.asset ? urlFor(block.backgroundImage).width(1920).quality(80).url() : undefined
  const style = bg
    ? {
        backgroundImage: `linear-gradient(rgba(7,7,7,0.55), rgba(7,7,7,0.85)), url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined
  return (
    <section className="section bg-black" style={style}>
      <div className="container">
        {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
        <h1 className="h1" style={{ maxWidth: '18ch' }}>{block.headline}</h1>
        {block.subhead ? <p className="lead" style={{ marginTop: '1.25rem' }}>{block.subhead}</p> : null}
        {Array.isArray(block.ctas) && block.ctas.length ? (
          <div className="btn-row" style={{ marginTop: '1.75rem' }}>
            {block.ctas.map((c: any, i: number) => (
              <CtaLink key={i} cta={c} variant={i === 0 ? 'accent' : 'outline'} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
