import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function LogoWall({ block }: { block: any }) {
  const logos: any[] = Array.isArray(block.logos) ? block.logos : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading logowall-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      {block.layout === 'grid' ? (
        <div className="logo-grid">
          {logos.map((logo, i) =>
            logo?.asset ? (
              <div key={i} className="logo-cell">
                <img src={urlFor(logo).width(460).url()} alt={logo.alt || ''} loading="lazy" />
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <div className="logo-row">
          {logos.map((logo, i) =>
            logo?.asset ? (
              <img key={i} className="logo-item" src={urlFor(logo).height(240).url()} alt={logo.alt || ''} loading="lazy" />
            ) : null,
          )}
        </div>
      )}
    </Section>
  )
}
