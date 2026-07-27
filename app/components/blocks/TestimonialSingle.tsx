import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function TestimonialSingle({ block }: { block: any }) {
  const t = block.testimonial
  if (!t) return null
  return (
    <Section settings={block.settings} container="wide" className="testimonial-section">
      <div className="testimonial">
        {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
        {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
        <div className="testimonial-body">
          <span className="testimonial-mark" aria-hidden="true">&ldquo;</span>
          <figure className="testimonial-content">
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <span className="testimonial-name">{t.name}</span>
              {t.roleCompany ? <span className="testimonial-role">{t.roleCompany}</span> : null}
            </figcaption>
          </figure>
        </div>
      </div>
    </Section>
  )
}
