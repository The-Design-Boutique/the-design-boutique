import { Section } from '../Section'
import { CtaLink } from '../CtaLink'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function CtaBand({ block }: { block: any }) {
  const settings = block.settings || { background: 'forest' }
  const lines: string[] = String(block.headline || '').split('\n')
  const lastIndex = lines.length - 1
  return (
    <Section settings={{ ...settings, background: settings.background || 'forest' }}>
      <div style={{ textAlign: 'center', maxWidth: '46rem', margin: '0 auto' }}>
        <h2 className="h2">
          {lines.map((ln, i) => (
            <span key={i}>
              {i > 0 ? <br /> : null}
              {i === lastIndex && block.underlineLastLine ? <span className="cta-underline">{ln}</span> : ln}
            </span>
          ))}
        </h2>
        {block.body ? <p className="lead" style={{ margin: '1rem auto 0' }}>{block.body}</p> : null}
        {Array.isArray(block.ctas) && block.ctas.length ? (
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: '1.75rem' }}>
            {block.ctas.map((c: any, i: number) => (
              <CtaLink key={i} cta={c} variant={i === 0 ? 'accent' : 'outline'} />
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  )
}
