import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function IndustriesSection({ block }: { block: any }) {
  const stats: any[] = Array.isArray(block.stats) ? block.stats : []
  const cards: any[] = Array.isArray(block.cards) ? block.cards : []
  const hover = block.cardsHoverImage?.asset ? urlFor(block.cardsHoverImage).width(800).quality(75).url() : undefined
  const href = block.cardsLink?.href
  return (
    <Section settings={block.settings}>
      <div className="industries-grid">
        <div className="industries-left">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.body ? <p className="lead industries-body">{block.body}</p> : null}
          {block.statsHeading ? <p className="industries-stats-heading">{block.statsHeading}</p> : null}
          {stats.length ? (
            <div className="industries-stats">
              {stats.map((s, i) => (
                <div key={i} className="stat">
                  <div className="stat-value">
                    {s.value}
                    {s.suffix ? <span className="stat-suffix">{s.suffix}</span> : null}
                  </div>
                  {s.label ? <p className="stat-label">{s.label}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="industries-cards">
          {cards.map((c, i) => {
            const inner = (
              <>
                {hover ? (
                  <span
                    className="service-card-hover"
                    style={{ backgroundImage: `linear-gradient(rgba(7,7,7,0.45), rgba(7,7,7,0.55)), url(${hover})` }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="service-card-body">
                  <span className="h3 service-title">{c.title}</span>
                  {c.text ? <span className="service-text">{c.text}</span> : null}
                </span>
              </>
            )
            return href ? (
              <a key={i} className="service-card industry-card" href={href}>{inner}</a>
            ) : (
              <div key={i} className="service-card industry-card">{inner}</div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
