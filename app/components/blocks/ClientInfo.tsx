import { PortableText } from '@portabletext/react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ClientInfo({ block }: { block: any }) {
  const meta: any[] = Array.isArray(block.meta) ? block.meta : []
  return (
    <Section settings={block.settings}>
      <div className="split-row">
        <div>
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <div style={{ marginTop: '1rem', color: 'var(--tdb-offwhite)' }}><PortableText value={block.intro} /></div> : null}
        </div>
        {meta.length ? (
          <dl style={{ display: 'grid', gap: '0.75rem', margin: 0 }}>
            {meta.map((row, i) => (
              <div key={i} style={{ borderBottom: '1px solid #2b2b2b', paddingBottom: '0.75rem' }}>
                <dt style={{ color: 'var(--tdb-accent)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</dt>
                <dd style={{ margin: '0.25rem 0 0' }}>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </Section>
  )
}
