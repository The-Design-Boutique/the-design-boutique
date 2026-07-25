import { PortableText } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { CtaLink } from '../CtaLink'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SubpageBanner({ block }: { block: any }) {
  // Plain variants: black background with the redwood-leaf motif and no photo.
  // 'plain' is left-aligned (Trusted, More Testimonials); 'plainCenter' is centered (Thank You).
  const plain = block.variant === 'plain'
  const plainCenter = block.variant === 'plainCenter'
  const blackLeaf = plain || plainCenter
  const leftAligned = !!(block.sideImage?.asset || plain)
  // The subpage hero background is a site constant (the night-bridge photo); a per-page
  // backgroundImage may still override it.
  const override = block.backgroundImage?.asset ? urlFor(block.backgroundImage).width(2400).quality(80).url() : undefined
  const bg = override || '/subpage-banner.jpg'
  const style = blackLeaf
    ? undefined
    : { backgroundImage: `linear-gradient(rgba(7,7,7,0.15), rgba(7,7,7,0.55)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
  const side = block.sideImage?.asset ? urlFor(block.sideImage).width(900).url() : undefined
  const titleLines = String(block.title).split('\n')
  const copy = (
    <>
      {block.eyebrow ? <p className="eyebrow" style={{ textAlign: leftAligned ? 'left' : 'center' }}>{block.eyebrow}</p> : null}
      <h1 className={`h1 subpage-banner-title${leftAligned ? ' subpage-banner-title--left' : ''}`}>
        {titleLines.map((l, i) => <span key={i}>{l}{i < titleLines.length - 1 ? <br /> : null}</span>)}
      </h1>
      {Array.isArray(block.subtitleRich) && block.subtitleRich.length ? (
        <div className="lead subpage-banner-subtitle prose">
          <PortableText value={block.subtitleRich} />
        </div>
      ) : block.subtitle ? (
        <p className="lead subpage-banner-subtitle">{block.subtitle}</p>
      ) : null}
      {block.footnote ? (
        <div className="subpage-banner-footnote">
          {String(block.footnote).split('\n').filter((p: string) => p.trim()).map((p: string, i: number) => <p key={i}>{p}</p>)}
        </div>
      ) : null}
      {block.googleRating?.rating ? (
        <div className={`google-rating${leftAligned ? ' google-rating--left' : ''}`}>
          <img className="google-rating-logo" src="/google-logo.svg" alt="Google" />
          <span className="google-rating-label">Ratings</span>
          <span className="google-rating-score">{block.googleRating.rating}</span>
          <span className="google-rating-stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          {block.googleRating.reviewCount ? <span className="google-rating-count">{block.googleRating.reviewCount}</span> : null}
        </div>
      ) : null}
      {block.cta?.href ? (
        <div className="subpage-banner-cta">
          <CtaLink cta={block.cta} variant="accent" />
        </div>
      ) : null}
    </>
  )
  return (
    <section
      className={`section subpage-banner bg-black${side || blackLeaf ? '' : ' subpage-banner--hero'}${blackLeaf ? ' subpage-banner--plain with-leaf with-leaf--right' : ''}${plainCenter ? ' subpage-banner--plain-center' : ''}`}
      style={style}
    >
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
