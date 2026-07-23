'use client'

import { useState } from 'react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ContactForm({ block }: { block: any }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    if (data.company) return // honeypot
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined }),
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'var(--tdb-dark)',
    border: '1px solid #2b2b2b',
    color: 'var(--tdb-white)',
    fontFamily: 'inherit',
    fontSize: '1rem',
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
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '36rem', margin: '0 auto' }}>
          <input type="text" name="company" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />
          <label>
            <span style={{ display: 'block', marginBottom: '0.35rem' }}>Name</span>
            <input style={inputStyle} type="text" name="name" required />
          </label>
          <label>
            <span style={{ display: 'block', marginBottom: '0.35rem' }}>Email</span>
            <input style={inputStyle} type="email" name="email" required />
          </label>
          <label>
            <span style={{ display: 'block', marginBottom: '0.35rem' }}>Message</span>
            <textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} name="message" required />
          </label>
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
