import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function TestimonialSingle({ block }: { block: any }) {
  const t = block.testimonial
  if (!t) return null
  const img = t.image?.asset ? urlFor(t.image).width(160).height(160).fit('crop').url() : undefined
  return (
    <Section settings={block.settings}>
      <figure style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
        <blockquote style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', lineHeight: 1.3, margin: 0, fontWeight: 600 }}>
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <figcaption style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
          {img ? <img src={img} alt={t.image?.alt || t.name} width={48} height={48} style={{ borderRadius: '50%' }} /> : null}
          <span>
            <strong>{t.name}</strong>
            {t.roleCompany ? <span style={{ color: 'var(--tdb-offwhite)' }}>, {t.roleCompany}</span> : null}
          </span>
        </figcaption>
      </figure>
    </Section>
  )
}
