import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ServicesGrid({ block }: { block: any }) {
  const services: any[] = Array.isArray(block.services) ? block.services : []
  return (
    <Section settings={block.settings}>
      {(block.heading || block.intro) && (
        <div className="section-heading">
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="lead">{block.intro}</p> : null}
        </div>
      )}
      <div className="grid grid--3">
        {services.map((s, i) => {
          const inner = (
            <>
              {s.icon ? <div style={{ color: 'var(--tdb-accent)', fontWeight: 700, marginBottom: '0.75rem' }}>{s.icon}</div> : null}
              <h3 className="h3">{s.title}</h3>
              {s.description ? <p>{s.description}</p> : null}
            </>
          )
          return s.link?.href ? (
            <a key={i} className="card" href={s.link.href} style={{ display: 'block', color: 'inherit' }}>
              {inner}
            </a>
          ) : (
            <div key={i} className="card">{inner}</div>
          )
        })}
      </div>
    </Section>
  )
}
