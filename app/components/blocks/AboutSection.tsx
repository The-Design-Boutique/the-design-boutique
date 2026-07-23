import { Section } from '../Section'
import { CtaLink } from '../CtaLink'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AboutSection({ block }: { block: any }) {
  const img = block.image?.asset ? urlFor(block.image).width(900).url() : undefined
  const cards: any[] = Array.isArray(block.cards) ? block.cards : []
  return (
    <Section settings={block.settings} container="wide">
      <div className="about-grid">
        <div className="about-media">
          {img ? <img src={img} alt={block.image?.alt || ''} loading="lazy" /> : null}
        </div>
        <div className="about-content">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.body ? <p className="lead about-body">{block.body}</p> : null}
          {cards.length ? (
            <div className="about-cards">
              {cards.map((c, i) => (
                <div key={i} className="about-card">
                  <h3 className="h3">{c.title}</h3>
                  {c.text ? <p>{c.text}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
          {block.cta?.href ? (
            <div className="about-cta">
              <CtaLink cta={block.cta} variant="outline" />
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
