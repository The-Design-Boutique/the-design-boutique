import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ServicesGrid({ block }: { block: any }) {
  const services: any[] = Array.isArray(block.services) ? block.services : []
  return (
    <Section settings={block.settings} className="services-section">
      {(block.eyebrow || block.heading || block.intro) && (
        <div className="section-heading section-heading--left">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="lead">{block.intro}</p> : null}
        </div>
      )}
      <div className="grid grid--3 services-grid">
        {services.map((s, i) => {
          const icon = s.iconImage?.asset ? urlFor(s.iconImage).width(96).url() : undefined
          const hover = s.hoverImage?.asset ? urlFor(s.hoverImage).width(900).quality(75).url() : undefined
          const inner = (
            <>
              {hover ? (
                <span
                  className="service-card-hover"
                  style={{ backgroundImage: `linear-gradient(rgba(7,7,7,0.45), rgba(7,7,7,0.55)), url(${hover})` }}
                  aria-hidden="true"
                />
              ) : null}
              <span className="service-card-body">
                {icon ? <img className="service-icon" src={icon} alt="" width={48} height={48} loading="lazy" /> : null}
                <span className="h3 service-title">{s.title}</span>
                {s.description ? <span className="service-text">{s.description}</span> : null}
              </span>
            </>
          )
          return s.link?.href ? (
            <a key={i} className="service-card" href={s.link.href}>{inner}</a>
          ) : (
            <div key={i} className="service-card">{inner}</div>
          )
        })}
      </div>
    </Section>
  )
}
