import { Section } from '../Section'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function PortfolioLoop({ block }: { block: any }) {
  const limit = typeof block.limit === 'number' ? block.limit : 12
  const categoryId: string | undefined = block.category?._ref

  const query = categoryId
    ? `*[_type == "client" && category._ref == $categoryId] | order(_createdAt desc)[0...$limit]{ title, "slug": slug.current, logo }`
    : `*[_type == "client"] | order(_createdAt desc)[0...$limit]{ title, "slug": slug.current, logo }`
  const clients: any[] = await client.fetch(query, categoryId ? { categoryId, limit } : { limit })

  if (!clients?.length) return null
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
