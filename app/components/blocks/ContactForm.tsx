'use client'

import { useState } from 'react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'transparent',
  border: '1px solid #5a5a5a',
  color: 'var(--tdb-white)',
  fontFamily: 'inherit',
  fontSize: '1rem',
}

const INTEREST_OPTIONS = ['Web Design', 'SEO', 'GEO', 'AI Search Optimization', 'CRO', 'Content Marketing', 'Brand Identity', 'Email Marketing', 'Ad Campaign & Strategy', 'Something else']
const SOURCE_OPTIONS = ['Google Search', 'AI Search (ChatGPT, Perplexity)', 'Referral', 'Social Media', 'Other']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: '0.35rem' }}>{label}</span>
      {children}
    </label>
  )
}

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 3 }}>
    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="var(--tdb-accent)" />
  </svg>
)
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 3 }}>
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" fill="var(--tdb-accent)" />
  </svg>
)

export function ContactForm({ block }: { block: any }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    if (data.company) return // honeypot
    setStatus('sending')
    const name = `${data.firstName || ''} ${data.lastName || ''}`.trim()
    const message = [
      data.interest ? `Interested in: ${data.interest}` : '',
      data.source ? `How they found us: ${data.source}` : '',
      data.url ? `Website: ${data.url}` : '',
      '',
      data.message || '',
    ].filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== '')).join('\n')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: data.email, message, pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined }),
      })
      if (res.ok) {
        setStatus('sent')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const bullets: string[] = Array.isArray(block.bullets) ? block.bullets : []
  const hasLeft = !!(block.leftHeading || block.leftBody || bullets.length || block.addressHeading || block.addressLines || block.phone)

  const formCol = (
    <div className="contact-form-col">
      {(block.eyebrow || block.heading) && (
        <div className="contact-form-heading">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="lead">{block.intro}</p> : null}
        </div>
      )}
      {status === 'sent' ? (
            <p role="status" style={{ color: 'var(--tdb-accent)', fontWeight: 700 }}>
              {block.successMessage || 'Thanks, we will be in touch shortly.'}
            </p>
          ) : (
            <form className="contact-form" onSubmit={onSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
              <input type="text" name="company" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />
              <div className="split-row" style={{ gap: '1.25rem' }}>
                <Field label="First Name *"><input style={inputStyle} type="text" name="firstName" placeholder="First Name*" required /></Field>
                <Field label="Last Name *"><input style={inputStyle} type="text" name="lastName" placeholder="Last Name" required /></Field>
              </div>
              <div className="split-row" style={{ gap: '1.25rem' }}>
                <Field label="Email *"><input style={inputStyle} type="email" name="email" placeholder="Email*" required /></Field>
                <Field label="Your URL"><input style={inputStyle} type="url" name="url" placeholder="Website URL" /></Field>
              </div>
              <div className="split-row" style={{ gap: '1.25rem' }}>
                <Field label="I am interested in">
                  <select style={{ ...inputStyle, color: 'var(--tdb-accent)' }} name="interest" defaultValue="Web Design">
                    {INTEREST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="How did you find us?">
                  <select style={{ ...inputStyle, color: 'var(--tdb-accent)' }} name="source" defaultValue="Google Search">
                    {SOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Message *"><textarea style={{ ...inputStyle, minHeight: 160, resize: 'vertical' }} name="message" placeholder="Message" required /></Field>
              <button className="btn btn--send" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : `${block.submitLabel || 'Send a Message'} +`}
              </button>
              {status === 'error' ? <p style={{ color: '#ff6b6b' }}>Something went wrong. Please try again.</p> : null}
            </form>
          )}
    </div>
  )

  if (!hasLeft) {
    return (
      <Section settings={block.settings} container="narrow">
        <div className="contact-centered">{formCol}</div>
      </Section>
    )
  }

  return (
    <Section settings={block.settings} className="with-leaf">
      <div className="contact-grid">
        <div className="contact-intro">
          {block.leftHeading ? <h2 className="h2">{block.leftHeading}</h2> : null}
          {block.leftBody ? <p className="lead">{block.leftBody}</p> : null}
          {bullets.length ? (
            <ul className="contact-bullets">
              {bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          ) : null}
          {(block.addressHeading || block.addressLines || block.phone) && (
            <div className="contact-address">
              {block.addressHeading ? <p className="contact-address-heading">{block.addressHeading}</p> : null}
              {block.addressLines ? (
                <p className="contact-address-line"><PinIcon /><span style={{ whiteSpace: 'pre-line' }}>{block.addressLines}</span></p>
              ) : null}
              {block.phone ? <p className="contact-address-line"><PhoneIcon /><span>{block.phone}</span></p> : null}
            </div>
          )}
        </div>
        {formCol}
      </div>
    </Section>
  )
}
