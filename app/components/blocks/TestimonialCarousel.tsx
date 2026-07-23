import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function TestimonialCarousel({ block }: { block: any }) {
  const items: any[] = Array.isArray(block.testimonials) ? block.testimonials : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="grid grid--3">
        {items.map((t, i) => (
          <figure key={i} className="card" style={{ margin: 0 }}>
            <blockquote style={{ margin: 0, fontSize: '1.05rem' }}>&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {t.image?.asset ? <img src={urlFor(t.image).width(40).height(40).fit('crop').url()} alt={t.image.alt || t.name} width={40} height={40} style={{ borderRadius: '50%' }} /> : null}
              <span><strong>{t.name}</strong>{t.roleCompany ? <span style={{ color: 'var(--tdb-offwhite)' }}>, {t.roleCompany}</span> : null}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}
