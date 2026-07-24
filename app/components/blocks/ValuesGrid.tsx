import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ValuesGrid({ block }: { block: any }) {
  const values: any[] = Array.isArray(block.values) ? block.values : []
  return (
    <Section settings={block.settings}>
      {block.eyebrow || block.heading || block.intro ? (
        <div className="values-intro">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="values-lead">{block.intro}</p> : null}
        </div>
      ) : null}
      <div className="values-grid">
        {values.map((v, i) => (
          <div key={i} className="value-card">
            {v.tree ? <img className="value-icon" src={`/trees/${v.tree}.svg`} alt="" aria-hidden="true" /> : null}
            {v.name ? <p className="value-name">{v.name}</p> : null}
            {v.equation ? <h3 className="value-equation">{v.equation}</h3> : null}
            {v.description ? <p className="value-desc">{v.description}</p> : null}
          </div>
        ))}
      </div>
    </Section>
  )
}
