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

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 3 }}>
    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="var(--tdb-white)" />
  </svg>
)
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 3 }}>
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" fill="var(--tdb-white)" />
  </svg>
)

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
  const bullets: string[] = Array.isArray(block.bullets) ? block.bullets : []
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

  // Laney's two-column contact section: intro on the left, form on the right.
  // Reuses the original classes and icons so it is visually identical to the
  // hand-built block it replaces.
  if (variant === 'split') {
    return (
      <Section settings={block.settings} className="with-leaf">
        <div className="contact-grid">
          <div className="contact-intro">
            {block.leftHeading ? <h2 className="h2">{block.leftHeading}</h2> : null}
            {block.leftBody ? <p className="lead">{block.leftBody}</p> : null}
            {bullets.length ? (
              <ul className="contact-bullets">
                {bullets.map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
            {block.addressHeading || block.addressLines || block.phone ? (
              <div className="contact-address">
                {block.addressHeading ? <p className="contact-address-heading">{block.addressHeading}</p> : null}
                {block.addressLines ? (
                  <p className="contact-address-line">
                    <PinIcon />
                    <span style={{ whiteSpace: 'pre-line' }}>{block.addressLines}</span>
                  </p>
                ) : null}
                {block.phone ? (
                  <p className="contact-address-line">
                    <PhoneIcon />
                    <span>{block.phone}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="contact-form-col">{body}</div>
        </div>
      </Section>
    )
  }

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
