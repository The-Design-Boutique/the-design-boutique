import { PortableText } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { CtaLink } from '../CtaLink'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SubpageBanner({ block }: { block: any }) {
  // The subpage hero background is a site constant (the night-bridge photo); a per-page
  // backgroundImage may still override it.
  const override = block.backgroundImage?.asset ? urlFor(block.backgroundImage).width(2400).quality(80).url() : undefined
  const bg = override || '/subpage-banner.jpg'
  const style = { backgroundImage: `linear-gradient(rgba(7,7,7,0.45), rgba(7,7,7,0.82)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  const side = block.sideImage?.asset ? urlFor(block.sideImage).width(900).url() : undefined
  const copy = (
    <>
      {block.eyebrow ? <p className="eyebrow" style={{ textAlign: side ? 'left' : 'center' }}>{block.eyebrow}</p> : null}
      <h1 className={`h1 subpage-banner-title${side ? ' subpage-banner-title--left' : ''}`}>{block.title}</h1>
      {Array.isArray(block.subtitleRich) && block.subtitleRich.length ? (
        <div className="lead subpage-banner-subtitle prose">
          <PortableText value={block.subtitleRich} />
        </div>
      ) : block.subtitle ? (
        <p className="lead subpage-banner-subtitle">{block.subtitle}</p>
      ) : null}
      {block.footnote ? <p className="subpage-banner-footnote">{block.footnote}</p> : null}
      {block.cta?.href ? (
        <div className="subpage-banner-cta">
          <CtaLink cta={block.cta} variant="accent" />
        </div>
      ) : null}
    </>
  )
  return (
    <section className={`section subpage-banner bg-black${side ? '' : ' subpage-banner--hero'}`} style={style}>
      <div className="container">
        {side ? (
          <div className="subpage-banner-grid">
            <div>{copy}</div>
            <div className="subpage-banner-media">
              <img src={side} alt={block.sideImage?.alt || ''} />
            </div>
          </div>
        ) : (
          copy
        )}
      </div>
    </section>
  )
}
