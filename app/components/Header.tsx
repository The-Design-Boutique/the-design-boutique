'use client'

import { useState } from 'react'
import { CtaLink } from './CtaLink'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function Header({ nav, settings }: { nav?: any; settings?: any }) {
  const [open, setOpen] = useState(false)
  const menu: any[] = Array.isArray(nav?.headerMenu) ? nav.headerMenu : []
  const cta = nav?.headerCta
  const siteName = settings?.siteName || 'The Design Boutique'

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(7,7,7,0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1a1a1a',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 72 }}>
        <a href="/" style={{ fontWeight: 700, color: 'var(--tdb-white)', fontSize: '1.05rem' }}>{siteName}</a>

        <nav className="site-nav" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {menu.map((item, i) => (
            <a key={i} href={item.link?.href || '#'} style={{ color: 'var(--tdb-white)' }}>{item.label}</a>
          ))}
          {cta?.label ? <CtaLink cta={{ label: cta.label, href: cta.link?.href }} /> : null}
        </nav>

        <button
          className="site-nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ display: 'none', background: 'transparent', border: 0, color: 'var(--tdb-white)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open ? (
        <nav className="site-nav-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem var(--gutter) 1rem' }}>
          {menu.map((item, i) => (
            <a key={i} href={item.link?.href || '#'} style={{ color: 'var(--tdb-white)', padding: '0.5rem 0' }} onClick={() => setOpen(false)}>{item.label}</a>
          ))}
          {cta?.label ? <div style={{ marginTop: '0.5rem' }}><CtaLink cta={{ label: cta.label, href: cta.link?.href }} /></div> : null}
        </nav>
      ) : null}
    </header>
  )
}
