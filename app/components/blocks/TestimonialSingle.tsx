import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function TestimonialSingle({ block }: { block: any }) {
  const t = block.testimonial
  if (!t) return null
  return (
    <Section settings={block.settings}>
      <div className="testimonial">
        {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
        {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
        <figure style={{ margin: 0 }}>
          <span className="testimonial-mark" aria-hidden="true">&ldquo;</span>
          <blockquote>{t.quote}</blockquote>
          <figcaption>
            {t.name}
            {t.roleCompany ? <span>, {t.roleCompany}</span> : null}
          </figcaption>
        </figure>
      </div>
    </Section>
  )
}
