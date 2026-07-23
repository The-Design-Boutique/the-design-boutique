import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function LogoWall({ block }: { block: any }) {
  const logos: any[] = Array.isArray(block.logos) ? block.logos : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading logowall-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="logo-row">
        {logos.map((logo, i) =>
          logo?.asset ? (
            <img key={i} className="logo-item" src={urlFor(logo).height(240).url()} alt={logo.alt || ''} loading="lazy" />
          ) : null,
        )}
      </div>
    </Section>
  )
}
