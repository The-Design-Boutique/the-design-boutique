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
  const withLeaf = !!block.wideWithLeaf
  const wide = !!block.wide
  const isDefault = !withLeaf && !wide
  return (
    <Section
      settings={block.settings}
      container={isDefault ? 'narrow' : 'default'}
      className={withLeaf ? 'rt-leaf-right' : undefined}
    >
      <div className={`prose${withLeaf ? ' prose--about' : ''}${wide ? ' prose--wide' : ''}`}>
        <PortableText value={block.content} components={components} />
      </div>
    </Section>
  )
}
