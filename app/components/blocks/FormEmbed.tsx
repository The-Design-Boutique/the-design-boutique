import { client } from '@/sanity/lib/client'
import { Section } from '../Section'
import { FormRenderer, type FormDoc } from '../forms/FormRenderer'

/**
 * The page-builder block that places a form on a page.
 *
 * The form definition is fetched here on the server, so the browser receives
 * only what it needs to draw the fields. Notification addresses and webhook
 * targets never leave the server.
 *
 * The centred variant reuses the contact page's own heading classes, so a form
 * built in the CMS sits in the design exactly where the hand-built one did.
 */

const FORM_QUERY = `*[_type == "form" && _id == $id][0]{
  _id, title, "slug": slug.current, fields, settings, stepRouting
}`

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function FormEmbed({ block }: { block: any }) {
  const id = block?.form?._ref
  if (!id) return null

  const form = await client.fetch<FormDoc | null>(FORM_QUERY, { id })
  if (!form?.slug) return null

  const variant = block.variant || 'centered'
  const heading = (
    <div className="contact-form-heading">
      {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
      {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
      {block.intro ? <p className="lead">{block.intro}</p> : null}
    </div>
  )

  const body = (
    <>
      {block.eyebrow || block.heading || block.intro ? heading : null}
      <FormRenderer form={form} />
    </>
  )

  if (variant === 'centered') {
    return (
      <Section settings={block.settings}>
        <div className="container">
          <div className="contact-centered">
            <div className="contact-form-col">{body}</div>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section settings={block.settings}>
      <div className={`container container--narrow${variant === 'card' ? ' fba-embed--card' : ''}`}>{body}</div>
    </Section>
  )
}
