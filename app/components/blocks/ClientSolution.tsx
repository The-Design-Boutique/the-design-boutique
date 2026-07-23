import { PortableText } from '@portabletext/react'
import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ClientSolution({ block }: { block: any }) {
  const img = block.image?.asset ? urlFor(block.image).width(900).quality(80).url() : undefined
  return (
    <Section settings={block.settings}>
      <div className="split-row">
        <div>
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.body ? <div style={{ marginTop: '1rem', color: 'var(--tdb-offwhite)' }}><PortableText value={block.body} /></div> : null}
        </div>
        <div>{img ? <img src={img} alt={block.image?.alt || ''} style={{ width: '100%', display: 'block' }} /> : null}</div>
      </div>
    </Section>
  )
}
