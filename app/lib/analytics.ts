/**
 * Telling Tag Manager that something worth counting just happened.
 *
 * Everything here is a no-op unless a Tag Manager container is loaded, which it
 * is not until go-live. That is deliberate: the site should behave identically
 * whether or not anybody is measuring it, and nothing in this file should ever
 * be able to break a form.
 *
 * Why push events ourselves rather than let Tag Manager watch the page:
 *
 * Tag Manager's built-in form trigger works by observing a form submission
 * navigating the page. Our forms do not navigate: they call preventDefault and
 * post in the background, which is what makes them feel instant. That trigger
 * would never fire, and the usual symptom is a container that looks correctly
 * configured and records nothing.
 *
 * Pushing from our own code is also simply more truthful. It fires when the
 * server has accepted a submission, not when somebody clicked a button that may
 * then have failed validation. A conversion count that includes failed attempts
 * is worse than no count, because it looks credible.
 */

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

/**
 * Push an event, if anything is listening.
 *
 * Wrapped in a try because analytics must never be the reason a form breaks.
 * A dropped event costs a row in a report; an exception here would cost an
 * enquiry.
 */
export function trackEvent(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
  } catch {
    // Deliberately silent. Nothing a visitor does should be interrupted by
    // measurement failing.
  }
}

/**
 * A form was accepted by the server.
 *
 * The form is identified because "somebody submitted a form" is not a useful
 * number on a site with several: a newsletter signup and an enquiry from a law
 * firm are different events and averaging them together makes both meaningless.
 */
export function trackFormSubmit(form: { slug?: string; title?: string }): void {
  trackEvent('form_submit', {
    form_id: form.slug || 'unknown',
    form_name: form.title || form.slug || 'unknown',
  })
}

/** Somebody tapped a phone number. On a phone this usually means a call. */
export function trackPhoneClick(number: string, location: string): void {
  trackEvent('phone_click', {
    phone_number: number,
    // Which part of the page it was tapped in, so a header number and a footer
    // number can be told apart when deciding where to put one.
    link_location: location,
  })
}
