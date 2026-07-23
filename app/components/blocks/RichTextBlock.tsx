import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
const components: PortableTextComponents = {
  types: {
    imageWithAlt: ({ value }: any) =>
      value?.asset ? <img className="prose-img" src={urlFor(value).width(1200).url()} alt={value.alt || ''} loading="lazy" /> : null,
    image: ({ value }: any) =>
      value?.asset ? <img className="prose-img" src={urlFor(value).width(1200).url()} alt={value.alt || ''} loading="lazy" /> : null,
  },
}

export function RichTextBlock({ block }: { block: any }) {
  if (!block.content) return null
  const wide = !!block.wideWithLeaf
  return (
    <Section settings={block.settings} container={wide ? 'default' : 'narrow'} className={wide ? 'rt-leaf-right' : undefined}>
      <div className={`prose${wide ? ' prose--about' : ''}`}>
        <PortableText value={block.content} components={components} />
      </div>
    </Section>
  )
}
