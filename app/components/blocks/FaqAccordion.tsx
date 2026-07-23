import { PortableText } from '@portabletext/react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function FaqAccordion({ block }: { block: any }) {
  const faqs: any[] = Array.isArray(block.faqs) ? block.faqs : []
  return (
    <Section settings={block.settings} container="wide" className="with-leaf faq-with-leaf">
      {(block.eyebrow || block.heading || block.intro) && (
        <div className="section-heading section-heading--wide">
          {block.eyebrow ? <p className="eyebrow" style={{ textAlign: 'center' }}>{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="lead" style={{ marginInline: 'auto' }}>{block.intro}</p> : null}
        </div>
      )}
      <div className="faq-list">
        {faqs.map((f, i) => (
          <details key={i} className="faq-item">
            <summary>{f.question}</summary>
            {f.answer ? <div className="faq-answer"><PortableText value={f.answer} /></div> : null}
          </details>
        ))}
      </div>
    </Section>
  )
}
