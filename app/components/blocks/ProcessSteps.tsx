import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ProcessSteps({ block }: { block: any }) {
  const steps: any[] = Array.isArray(block.steps) ? block.steps : []
  const cols = block.columns === '2' ? '2' : '3'
  return (
    <Section settings={block.settings}>
      {block.eyebrow || block.heading ? (
        <div className="section-heading section-heading--wide">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
        </div>
      ) : null}
      <div className={`process-steps process-steps--${cols}`}>
        {steps.map((s, i) => (
          <div key={i} className="process-step">
            <h3 className="process-step-title">
              {s.number != null ? <span className="process-step-num">{s.number}-&gt;</span> : null}
              {s.title}
            </h3>
            {s.description ? <p className="process-step-desc">{s.description}</p> : null}
          </div>
        ))}
      </div>
    </Section>
  )
}
