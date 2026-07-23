import { PortableText } from '@portabletext/react'
import { Section } from '../Section'
import { CtaLink } from '../CtaLink'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SolutionsRow({ block }: { block: any }) {
  const img = block.image?.asset ? urlFor(block.image).width(900).quality(80).url() : undefined
  const mediaLeft = block.layout === 'mediaLeft'
  return (
    <Section settings={block.settings}>
      <div className="split-row">
        <div style={{ order: mediaLeft ? 2 : 1 }}>
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.body ? <div style={{ marginTop: '1rem', color: 'var(--tdb-offwhite)' }}><PortableText value={block.body} /></div> : null}
          {Array.isArray(block.ctas) && block.ctas.length ? (
            <div className="btn-row" style={{ marginTop: '1.5rem' }}>
              {block.ctas.map((c: any, i: number) => <CtaLink key={i} cta={c} variant={i === 0 ? 'accent' : 'outline'} />)}
            </div>
          ) : null}
        </div>
        <div style={{ order: mediaLeft ? 1 : 2 }}>
          {img ? <img src={img} alt={block.image?.alt || ''} style={{ width: '100%', display: 'block' }} /> : null}
        </div>
      </div>
    </Section>
  )
}
