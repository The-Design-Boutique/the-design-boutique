import { PortableText } from '@portabletext/react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function RichTextBlock({ block }: { block: any }) {
  if (!block.content) return null
  return (
    <Section settings={block.settings} container="narrow">
      <div className="prose">
        <PortableText value={block.content} />
      </div>
    </Section>
  )
}
