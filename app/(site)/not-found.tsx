import Link from 'next/link'
import type { Metadata } from 'next'

/**
 * Shown when a URL does not match anything.
 *
 * Dead URLs are recorded by the catch-all route before it gives up, so this
 * page stays a plain apology with a way onward. Its job is to keep the visitor
 * moving, not to explain what went wrong.
 */

export const metadata: Metadata = {
  title: 'Page not found',
  // A 404 should never be indexed, whatever the site-wide setting is.
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <section className="section">
      <div className="container container--narrow">
        <h1 className="h1">We could not find that page</h1>
        <p className="lead">
          The link may be out of date, or the page may have moved. Nothing is broken on your end.
        </p>
        <div className="btn-row">
          <Link className="btn" href="/">
            Back to the homepage
          </Link>
          <Link className="btn" href="/contact">
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  )
}
