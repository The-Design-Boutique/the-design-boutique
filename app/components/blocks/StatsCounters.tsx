import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function StatsCounters({ block }: { block: any }) {
  const stats: any[] = Array.isArray(block.stats) ? block.stats : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="grid grid--4">
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 700, color: 'var(--tdb-accent)', lineHeight: 1 }}>
              {s.prefix || ''}{s.value}{s.suffix || ''}
            </div>
            {s.label ? <div style={{ marginTop: '0.5rem', color: 'var(--tdb-offwhite)' }}>{s.label}</div> : null}
          </div>
        ))}
      </div>
    </Section>
  )
}
