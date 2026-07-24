import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
const img = ({ value }: any) =>
  value?.asset ? (
    <img
      className={`prose-img${value.align === 'right' ? ' prose-img--right' : ''}`}
      src={urlFor(value).width(1200).url()}
      alt={value.alt || ''}
      loading="lazy"
    />
  ) : null

const components: PortableTextComponents = {
  types: { imageWithAlt: img, image: img },
  block: {
    eyebrow: ({ children }: any) => <p className="eyebrow">{children}</p>,
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
