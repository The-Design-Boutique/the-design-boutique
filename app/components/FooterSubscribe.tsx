'use client'

import { useState } from 'react'

export function FooterSubscribe() {
  const [sent, setSent] = useState(false)
  if (sent) {
    return <p style={{ color: 'var(--tdb-accent)', fontWeight: 700, margin: 0 }}>Thanks for subscribing.</p>
  }
  return (
    <form className="footer-subscribe" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
      <input type="email" name="email" placeholder="Email" aria-label="Email" required />
      <button className="btn" type="submit">Subscribe</button>
    </form>
  )
}
