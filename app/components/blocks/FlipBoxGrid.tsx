import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function FlipBoxGrid({ block }: { block: any }) {
  const boxes: any[] = Array.isArray(block.boxes) ? block.boxes : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="grid grid--3">
        {boxes.map((b, i) => (
          <div key={i} className="flip-box">
            <div className="flip-box-inner">
              <div className="flip-box-face flip-box-front">
                {b.icon ? <div style={{ color: 'var(--tdb-accent)', fontWeight: 700, marginBottom: '0.5rem' }}>{b.icon}</div> : null}
                <h3 className="h3">{b.frontTitle}</h3>
              </div>
              <div className="flip-box-face flip-box-back">
                {b.backText ? <p style={{ margin: 0 }}>{b.backText}</p> : null}
                {b.link?.href ? <a href={b.link.href} className="btn btn--outline" style={{ marginTop: '0.75rem' }}>{b.link.label || 'Learn more'}</a> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
