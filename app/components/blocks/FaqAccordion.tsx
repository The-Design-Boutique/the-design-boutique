import { PortableText } from '@portabletext/react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function FaqAccordion({ block }: { block: any }) {
  const faqs: any[] = Array.isArray(block.faqs) ? block.faqs : []
  return (
    <Section settings={block.settings} container="narrow">
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div>
        {faqs.map((f, i) => (
          <details key={i} style={{ borderBottom: '1px solid #2b2b2b', padding: '1rem 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', listStyle: 'none' }}>{f.question}</summary>
            {f.answer ? <div style={{ marginTop: '0.75rem', color: 'var(--tdb-offwhite)' }}><PortableText value={f.answer} /></div> : null}
          </details>
        ))}
      </div>
    </Section>
  )
}
