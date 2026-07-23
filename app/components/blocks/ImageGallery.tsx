import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ImageGallery({ block }: { block: any }) {
  const images: any[] = Array.isArray(block.images) ? block.images : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="grid grid--3">
        {images.map((img, i) =>
          img?.asset ? (
            <img key={i} src={urlFor(img).width(600).height(450).fit('crop').url()} alt={img.alt || ''} style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />
          ) : null,
        )}
      </div>
    </Section>
  )
}
