import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function WorkShowcase({ block }: { block: any }) {
  const items: any[] = Array.isArray(block.items) ? block.items : []
  return (
    <Section settings={block.settings}>
      {(block.eyebrow || block.heading || block.intro) && (
        <div className="section-heading">
          {block.eyebrow ? <p className="eyebrow" style={{ textAlign: 'center' }}>{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="lead">{block.intro}</p> : null}
        </div>
      )}
      <div className="work-grid">
        {items.map((it, i) => {
          const img = it.image?.asset ? urlFor(it.image).width(700).quality(80).url() : undefined
          const inner = (
            <>
              {img ? <span className="work-thumb"><img src={img} alt={it.label || ''} loading="lazy" /></span> : null}
              {it.label ? <span className="work-label">{it.label}</span> : null}
            </>
          )
          return it.link?.href ? (
            <a key={i} className="work-card" href={it.link.href}>{inner}</a>
          ) : (
            <div key={i} className="work-card">{inner}</div>
          )
        })}
      </div>
    </Section>
  )
}
