import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function EventGrid({ block }: { block: any }) {
  const items: any[] = Array.isArray(block.items) ? block.items : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading section-heading--wide"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="event-grid">
        {items.map((it, i) => (
          <article key={i} className="event-card">
            <h3 className="event-card-title">
              {it.href ? <a href={it.href} target="_blank" rel="noreferrer">{it.title}</a> : it.title}
            </h3>
            {it.date ? <p className="event-card-date">{it.date}</p> : null}
            {it.href ? (
              <a className="event-card-more" href={it.href} target="_blank" rel="noreferrer">
                {it.linkLabel || 'Replay'} &rarr;
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  )
}
