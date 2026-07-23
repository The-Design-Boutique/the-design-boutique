import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function LogoWall({ block }: { block: any }) {
  const logos: any[] = Array.isArray(block.logos) ? block.logos : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="grid grid--4" style={{ alignItems: 'center' }}>
        {logos.map((logo, i) =>
          logo?.asset ? (
            <img
              key={i}
              src={urlFor(logo).width(240).url()}
              alt={logo.alt || ''}
              style={{ maxHeight: 64, width: 'auto', margin: '0 auto', objectFit: 'contain' }}
            />
          ) : null,
        )}
      </div>
    </Section>
  )
}
