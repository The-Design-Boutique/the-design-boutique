'use client'

import { useState } from 'react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function TestimonialCarousel({ block }: { block: any }) {
  const items: any[] = Array.isArray(block.testimonials) ? block.testimonials : []
  const [i, setI] = useState(0)
  if (!items.length) return null
  const t = items[Math.min(i, items.length - 1)]
  const prev = () => setI((x) => (x - 1 + items.length) % items.length)
  const next = () => setI((x) => (x + 1) % items.length)
  return (
    <Section settings={block.settings} container="wide" className="testimonial-section">
      <div className="testimonial">
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
        {items.length > 1 ? (
          <div className="testimonial-nav">
            <button type="button" onClick={prev} aria-label="Previous testimonial">&#8249;</button>
            <button type="button" onClick={next} aria-label="Next testimonial">&#8250;</button>
          </div>
        ) : null}
      </div>
    </Section>
  )
}
