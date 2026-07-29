'use client'

import { useEffect } from 'react'
import { trackPhoneClick } from '@/app/lib/analytics'

/**
 * Records taps on any phone number, anywhere on the site.
 *
 * One listener on the document rather than a handler on each link. The number
 * appears in the header, the footer, the contact page and inside page content
 * an editor can add at any time, so attaching handlers individually would mean
 * touching several components today and quietly missing every number added
 * afterwards. Delegation catches all of them, including ones that do not exist
 * yet.
 *
 * It reports where in the page the tap happened, because "somebody called" is
 * less useful than knowing whether they called from the header on a phone or
 * from the bottom of a service page. Those suggest different things about the
 * page.
 *
 * Listening in the capture phase so the event is recorded before anything else
 * can stop it, and because a tel: link hands off to the operating system almost
 * immediately.
 */
export function PhoneClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null
      const link = target?.closest?.('a[href^="tel:"]') as HTMLAnchorElement | null
      if (!link) return

      const number = link.getAttribute('href')?.replace(/^tel:/, '').trim() || ''

      // Nearest meaningful landmark, so a header number and a footer number are
      // distinguishable in the report.
      const where =
        link.closest('header')
          ? 'header'
          : link.closest('footer')
            ? 'footer'
            : link.closest('form')
              ? 'form'
              : 'page'

      trackPhoneClick(number, where)
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}
