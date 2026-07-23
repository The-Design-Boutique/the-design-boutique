import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function PortfolioMosaic({ block }: { block: any }) {
  const clients: any[] = Array.isArray(block.clients) ? block.clients : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="grid grid--3">
        {clients.map((c, i) => (
          <a key={i} href={`/work/${c.slug}`} className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 140, color: 'inherit' }}>
            {c.logo?.asset ? (
              <img src={urlFor(c.logo).width(220).url()} alt={c.logo.alt || c.title} style={{ maxHeight: 72, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <span className="h3">{c.title}</span>
            )}
          </a>
        ))}
      </div>
    </Section>
  )
}
