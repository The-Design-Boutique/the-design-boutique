import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function IconGrid({ block }: { block: any }) {
  const items: any[] = Array.isArray(block.items) ? block.items : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="grid grid--3">
        {items.map((item, i) => (
          <div key={i} className="card">
            {item.icon ? <div style={{ color: 'var(--tdb-accent)', fontWeight: 700, marginBottom: '0.75rem' }}>{item.icon}</div> : null}
            <h3 className="h3">{item.title}</h3>
            {item.text ? <p>{item.text}</p> : null}
          </div>
        ))}
      </div>
    </Section>
  )
}
