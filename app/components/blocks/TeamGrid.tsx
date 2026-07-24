import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function TeamGrid({ block }: { block: any }) {
  const members: any[] = Array.isArray(block.members) ? block.members : []
  return (
    <Section settings={block.settings}>
      {block.eyebrow || block.heading || block.intro ? (
        <div className="section-heading section-heading--wide">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="section-intro">{block.intro}</p> : null}
        </div>
      ) : null}
      <div className="team-grid">
        {members.map((m, i) => (
          <figure key={i} className="team-card">
            {m.photo?.asset ? (
              <img src={urlFor(m.photo).width(560).url()} alt={m.photo.alt || m.name || ''} loading="lazy" />
            ) : null}
            <figcaption>
              {m.name ? <h3 className="team-name">{m.name}</h3> : null}
              {m.role ? <p className="team-role">{m.role}</p> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}
