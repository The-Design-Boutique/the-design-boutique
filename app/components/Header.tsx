'use client'

import { useEffect, useState } from 'react'
import { CtaLink } from './CtaLink'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function Header({ nav, settings }: { nav?: any; settings?: any }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menu: any[] = Array.isArray(nav?.headerMenu) ? nav.headerMenu : []
  const cta = nav?.headerCta
  const siteName = settings?.siteName || 'The Design Boutique'
  const logo = settings?.logo?.asset ? urlFor(settings.logo).height(120).url() : undefined
  const logo2 = settings?.logoSecondary?.asset ? urlFor(settings.logoSecondary).height(120).url() : undefined
  const phone = settings?.phone

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' site-header--solid' : ''}`}>
      <div className="container site-header-inner">
        <a href="/" className="site-logo" aria-label={siteName}>
          {logo ? <img src={logo} alt={settings?.logo?.alt || siteName} /> : <span>{siteName}</span>}
          {logo2 ? <img src={logo2} alt={settings?.logoSecondary?.alt || 'TDB Digital'} /> : null}
        </a>

        <nav className="site-nav">
          {menu.map((item, i) => (
            <a key={i} href={item.link?.href || '#'}>{item.label}</a>
          ))}
        </nav>

        <div className="site-header-right">
          {cta?.label ? <CtaLink cta={{ label: `${cta.label}  +`, href: cta.link?.href }} /> : null}
          {phone ? <a className="site-header-phone" href={`tel:${phone.replace(/[^0-9.]/g, '')}`}>{phone}</a> : null}
        </div>

        <button
          className="site-nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open ? (
        <nav className="site-nav-mobile">
          {menu.map((item, i) => (
            <a key={i} href={item.link?.href || '#'} onClick={() => setOpen(false)}>{item.label}</a>
          ))}
          {cta?.label ? <div style={{ marginTop: '0.5rem' }}><CtaLink cta={{ label: cta.label, href: cta.link?.href }} /></div> : null}
        </nav>
      ) : null}
    </header>
  )
}
