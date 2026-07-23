'use client'

import { useState } from 'react'
import { Section } from '../Section'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function NewsletterSignup({ block }: { block: any }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = new FormData(form).get('email')
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Newsletter subscriber', email, message: 'Newsletter signup' }),
      })
      setStatus(res.ok ? 'sent' : 'error')
      if (res.ok) form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <Section settings={block.settings} container="narrow">
      <div style={{ textAlign: 'center' }}>
        {block.heading ? <h2 className="h2">{block.heading}</h2> : null}
        {block.body ? <p className="lead" style={{ margin: '0.75rem auto 1.5rem' }}>{block.body}</p> : null}
        {status === 'sent' ? (
          <p style={{ color: 'var(--tdb-accent)', fontWeight: 700 }}>Thanks for subscribing!</p>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input type="email" name="email" required placeholder="Your email"
              style={{ padding: '0.85rem 1rem', background: 'var(--tdb-dark)', border: '1px solid #2b2b2b', color: 'var(--tdb-white)', minWidth: 260, fontFamily: 'inherit' }} />
            <button className="btn" type="submit" disabled={status === 'sending'}>{block.buttonLabel || 'Subscribe'}</button>
          </form>
        )}
        {block.disclaimer ? <p style={{ fontSize: '0.8rem', color: 'var(--tdb-offwhite)', marginTop: '1rem' }}>{block.disclaimer}</p> : null}
      </div>
    </Section>
  )
}
