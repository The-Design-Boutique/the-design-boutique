import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ImageGallery({ block }: { block: any }) {
  const images: any[] = Array.isArray(block.images) ? block.images : []
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading section-heading--wide"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className={`gallery-grid gallery-grid--${images.length === 1 ? '1' : images.length === 2 ? '2' : '3'}`}>
        {images.map((img, i) =>
          img?.asset ? (
            <img key={i} src={urlFor(img).width(900).url()} alt={img.alt || ''} loading="lazy" />
          ) : null,
        )}
      </div>
    </Section>
  )
}
