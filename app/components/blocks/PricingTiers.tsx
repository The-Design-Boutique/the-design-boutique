import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
function Feature({ line }: { line: string }) {
  const t = String(line || '')
  if (t.trim().startsWith('–') || t.trim().startsWith('-')) {
    // keep the dash visible (e.g. "– Google Assistant"), normalize spacing
    return <li className="tier-subitem">{t.trim().replace(/^[–-]\s*/, '– ')}</li>
  }
  const idx = t.indexOf(':')
  if (idx > 0 && idx < 40) {
    return (
      <li className="tier-item">
        <strong>{t.slice(0, idx + 1)}</strong>
        {t.slice(idx + 1)}
      </li>
    )
  }
  return <li className="tier-item"><strong>{t}</strong></li>
}

export function PricingTiers({ block }: { block: any }) {
  const tiers: any[] = Array.isArray(block.tiers) ? block.tiers : []
  return (
    <Section settings={block.settings}>
      {block.eyebrow || block.heading ? (
        <div className="section-heading section-heading--wide">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
        </div>
      ) : null}
      <div className="tier-grid">
        {tiers.map((t, i) => (
          <div key={i} className="tier-card">
            <h3 className={`tier-name tier-name--${t.metal || 'silver'}`}>{t.name}</h3>
            {t.goal ? <p className="tier-meta"><strong>Goal:</strong> {t.goal}</p> : null}
            {t.who ? <p className="tier-meta"><strong>Who:</strong> {t.who}</p> : null}
            {t.pace ? <p className="tier-meta"><strong>Pace:</strong> {t.pace}</p> : null}
            {t.caseStudyLabel ? (
              t.caseStudyHref ? (
                <a className="tier-casestudy" href={t.caseStudyHref}>{t.caseStudyLabel}</a>
              ) : (
                <p className="tier-casestudy">{t.caseStudyLabel}</p>
              )
            ) : null}
            {Array.isArray(t.features) && t.features.length ? (
              <ul className="tier-features">
                {t.features.map((f: string, j: number) => <Feature key={j} line={f} />)}
              </ul>
            ) : null}
            {t.cta?.href ? (
              <a className="btn tier-cta" href={t.cta.href}>
                <span>{t.cta.label || 'Get started'}</span>
                <span className="btn-plus">+</span>
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  )
}
