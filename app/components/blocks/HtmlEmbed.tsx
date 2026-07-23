import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function HtmlEmbed({ block }: { block: any }) {
  if (!block.html) return null
  return (
    <Section settings={block.settings}>
      <div dangerouslySetInnerHTML={{ __html: block.html }} />
    </Section>
  )
}
