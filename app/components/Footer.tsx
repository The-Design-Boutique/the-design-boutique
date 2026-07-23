import { urlFor } from '@/sanity/lib/image'
import { FooterSubscribe } from './FooterSubscribe'

/* eslint-disable @typescript-eslint/no-explicit-any */
const ICONS: Record<string, string> = {
  facebook: 'M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3V14h2.6v8h3.6z',
  twitter: 'M23.4 4.8c-.8.4-1.7.6-2.6.7a4.5 4.5 0 0 0 2-2.5c-.9.5-1.8.9-2.9 1.1a4.5 4.5 0 0 0-7.7 4.1A12.8 12.8 0 0 1 3 3.5a4.5 4.5 0 0 0 1.4 6 4.5 4.5 0 0 1-2-.6v.1c0 2.2 1.5 4 3.6 4.4a4.5 4.5 0 0 1-2 .1 4.5 4.5 0 0 0 4.2 3.1A9 9 0 0 1 2 18.6a12.8 12.8 0 0 0 6.9 2c8.3 0 12.8-6.9 12.8-12.8v-.6c.9-.6 1.6-1.4 2.2-2.3l-.5-.1z',
  youtube: 'M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.6 12 4.6 12 4.6s-7.5 0-9.4.5A3 3 0 0 0 .5 7.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-4.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z',
  instagram: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9a3.6 3.6 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1zM12 7.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4zm0 6.9a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4zm5.4-7.1a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
  google: 'M12 10.2v3.9h5.4c-.2 1.4-1.6 4.1-5.4 4.1-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.6 14.6 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.1-1.5H12z',
}

export function Footer({ nav, settings }: { nav?: any; settings?: any }) {
  const columns: any[] = Array.isArray(nav?.footerColumns) ? nav.footerColumns : []
  const social: any[] = Array.isArray(settings?.socialLinks) ? settings.socialLinks : []
  const siteName = settings?.siteName || 'The Design Boutique'
  const logo = settings?.logoSecondary?.asset ? urlFor(settings.logoSecondary).height(120).url() : undefined
  const phone = settings?.phone
  const address = settings?.address

  return (
    <footer className="site-footer">
      <div className="container container--wide">
        <div className="footer-top">
          <div className="footer-brand">
            {logo ? <img className="footer-logo" src={logo} alt={siteName} /> : null}
            {social.length ? (
              <div className="footer-social">
                {social.map((s, i) =>
                  s.platform === 'google' ? (
                    <a key={i} className="footer-google" href={s.url} target="_blank" rel="noopener noreferrer" aria-label="Google reviews">
                      <span className="footer-google-word">Google</span>
                      <span className="footer-google-card">
                        <svg className="footer-google-avatar" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="8" r="4" fill="currentColor" />
                          <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                        </svg>
                        <span className="footer-google-stars" aria-hidden="true">★★★★★</span>
                      </span>
                    </a>
                  ) : (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform}>
                      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                        <path d={ICONS[s.platform] || ICONS.google} fill="currentColor" />
                      </svg>
                    </a>
                  ),
                )}
              </div>
            ) : null}
          </div>

          {columns.map((col, i) => (
            <div key={i} className={`footer-col${col.title === 'Solutions' ? ' footer-col--wide' : ''}`}>
              {col.title ? <h3 className="footer-col-title">{col.title}</h3> : null}
              <ul className="footer-links">
                {(Array.isArray(col.links) ? col.links : []).map((l: any, j: number) => (
                  <li key={j}><a href={l.href || '#'}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-col">
            <h3 className="footer-col-title">We can&apos;t wait to connect</h3>
            {phone ? <a className="footer-contact-line" href={`tel:${phone.replace(/[^0-9.]/g, '')}`}>{phone} (Call or Text)</a> : null}
            {address ? (
              <span className="footer-address">
                {address.split('\n').map((line: string, i: number) => <span key={i} className="footer-contact-line">{line}</span>)}
              </span>
            ) : null}
          </div>

          <div className="footer-col footer-newsletter">
            <h3 className="footer-col-title">Stay in the know.</h3>
            <FooterSubscribe />
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            {siteName}, Inc. &copy; 2026. All Rights Reserved. {'| '}
            <a href="/privacy-policy">Privacy Policy</a> {'| '}
            <a href="/ada-compliance">ADA Compliance</a> {'| '}
            Site By Us!
          </p>
        </div>
      </div>
    </footer>
  )
}
