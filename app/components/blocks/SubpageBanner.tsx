import { urlFor } from '@/sanity/lib/image'
import { CtaLink } from '../CtaLink'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SubpageBanner({ block }: { block: any }) {
  const bg = block.backgroundImage?.asset ? urlFor(block.backgroundImage).width(2400).quality(80).url() : undefined
  const style = bg
    ? { backgroundImage: `linear-gradient(rgba(7,7,7,0.5), rgba(7,7,7,0.8)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined
  return (
    <section className="section subpage-banner bg-black" style={style}>
      <div className="container">
        {block.eyebrow ? <p className="eyebrow" style={{ textAlign: 'center' }}>{block.eyebrow}</p> : null}
        <h1 className="h1 subpage-banner-title">{block.title}</h1>
        {block.subtitle ? <p className="lead subpage-banner-subtitle">{block.subtitle}</p> : null}
        {block.cta?.href ? (
          <div className="subpage-banner-cta">
            <CtaLink cta={block.cta} variant="accent" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
