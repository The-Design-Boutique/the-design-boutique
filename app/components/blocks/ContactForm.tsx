'use client'

import { useState } from 'react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'var(--tdb-dark)',
  border: '1px solid #2b2b2b',
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

  return (
    <Section settings={block.settings} container="narrow">
      {(block.heading || block.intro) && (
        <div className="section-heading">
          {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
          {block.intro ? <p className="lead">{block.intro}</p> : null}
        </div>
      )}
      {status === 'sent' ? (
        <p role="status" style={{ textAlign: 'center', color: 'var(--tdb-accent)', fontWeight: 700 }}>
          {block.successMessage || 'Thanks, we will be in touch shortly.'}
        </p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '40rem', margin: '0 auto' }}>
          <input type="text" name="company" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />
          <div className="split-row" style={{ gap: '1rem' }}>
            <Field label="First Name *"><input style={inputStyle} type="text" name="firstName" required /></Field>
            <Field label="Last Name *"><input style={inputStyle} type="text" name="lastName" required /></Field>
          </div>
          <Field label="Email *"><input style={inputStyle} type="email" name="email" required /></Field>
          <Field label="Your URL"><input style={inputStyle} type="url" name="url" placeholder="https://" /></Field>
          <Field label="I am interested in">
            <select style={inputStyle} name="interest" defaultValue="Web Design">
              {INTEREST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="How did you find us?">
            <select style={inputStyle} name="source" defaultValue="Google Search">
              {SOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Message *"><textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} name="message" required /></Field>
          <div>
            <button className="btn" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : block.submitLabel || 'Send a Message'}
            </button>
          </div>
          {status === 'error' ? <p style={{ color: '#ff6b6b' }}>Something went wrong. Please try again.</p> : null}
        </form>
      )}
    </Section>
  )
}
