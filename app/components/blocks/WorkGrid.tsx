import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function WorkGrid({ block }: { block: any }) {
  const items: any[] = Array.isArray(block.items) ? block.items : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading section-heading--wide"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="work-grid">
        {items.map((it, i) => {
          const href = it.href || '#'
          const img = it.image?.asset ? urlFor(it.image).width(800).height(1040).fit('crop').url() : undefined
          return (
            <a key={i} href={href} className="work-card">
              {img ? <img className="work-card-img" src={img} alt={it.image?.alt || it.title || ''} loading="lazy" /> : null}
              <div className="work-card-overlay">
                {it.category ? <p className="work-card-cat">{it.category}</p> : null}
                {it.title ? <h3 className="work-card-title">{it.title}</h3> : null}
              </div>
            </a>
          )
        })}
      </div>
    </Section>
  )
}
