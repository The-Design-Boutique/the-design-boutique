import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function QuoteGrid({ block }: { block: any }) {
  const items: any[] = Array.isArray(block.items) ? block.items : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading section-heading--wide"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="quote-grid">
        {items.map((it, i) => (
          <figure key={i} className="quote-card">
            <blockquote>&ldquo;{it.quote}&rdquo;</blockquote>
            {it.author ? <figcaption>{it.author}</figcaption> : null}
          </figure>
        ))}
      </div>
    </Section>
  )
}
