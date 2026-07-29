/**
 * Consent: the parts that can be reasoned about without a browser.
 *
 * The enforcement engine itself has to run as a plain string of JavaScript in
 * the document head, before anything else on the page, so it cannot import from
 * here. What it can do is receive this data: the server serialises the blocklist
 * into the engine's config, so the list lives in exactly one place and is unit
 * tested here rather than inside a string.
 *
 * Ported from the Privacy Choices WordPress plugin (v2.1.1), which is the
 * reference implementation. Where the two differ it is noted, and the reason is
 * always that WordPress offers something Next.js does not, or the reverse.
 */

/** The categories the gate governs. `necessary` is implicit and never blocked. */
export const CATEGORIES = ['analytics', 'advertising', 'functional', 'session_replay'] as const

export type Category = (typeof CATEGORIES)[number]

/**
 * Tracker blocklist: a hostname substring, or a "host/path" prefix, mapped to
 * the category that must be granted before it may load.
 *
 * Matching is a substring test against `host + pathname`, which is why
 * "facebook.com/tr" pins the Meta pixel endpoint specifically while "clarity.ms"
 * deliberately catches every Microsoft Clarity subdomain.
 *
 * Session recording is its own category rather than part of analytics. A
 * heatmap tool records what someone typed and where they moved, which is a
 * different question from counting visits, and in several US states it is the
 * one that attracts wiretapping claims.
 */
export const DEFAULT_BLOCKLIST: Record<string, Category> = {
  // Advertising and marketing, which is what "sale or sharing" means in CCPA terms.
  'connect.facebook.net': 'advertising',
  'facebook.com/tr': 'advertising',
  'bat.bing.com': 'advertising',
  'googleadservices.com': 'advertising',
  'googlesyndication.com': 'advertising',
  'doubleclick.net': 'advertising',
  'google.com/pagead': 'advertising',
  'google.com/ads': 'advertising',
  'analytics.tiktok.com': 'advertising',
  'ads.tiktok.com': 'advertising',
  'snap.licdn.com': 'advertising',
  'px.ads.linkedin.com': 'advertising',
  'ads.pinterest.com': 'advertising',
  'ct.pinterest.com': 'advertising',
  'sc-static.net': 'advertising',
  'tr.snapchat.com': 'advertising',
  'adsystem.com': 'advertising',
  'adnxs.com': 'advertising',
  'criteo.com': 'advertising',
  'criteo.net': 'advertising',
  'taboola.com': 'advertising',
  'outbrain.com': 'advertising',

  // Measurement.
  'google-analytics.com': 'analytics',
  'analytics.google.com': 'analytics',
  'stats.g.doubleclick': 'analytics',
  'mixpanel.com': 'analytics',
  'segment.com': 'analytics',
  'segment.io': 'analytics',
  'amplitude.com': 'analytics',
  'heap.io': 'analytics',
  'heapanalytics.com': 'analytics',
  'matomo.cloud': 'analytics',

  // Session recording and heatmaps.
  'clarity.ms': 'session_replay',
  'hotjar.com': 'session_replay',
  'hotjar.io': 'session_replay',
  'fullstory.com': 'session_replay',
  'luckyorange.com': 'session_replay',
  'luckyorange.net': 'session_replay',
  'mouseflow.com': 'session_replay',
  'smartlook.com': 'session_replay',
  'inspectlet.com': 'session_replay',
  'logrocket.com': 'session_replay',
  'logrocket.io': 'session_replay',
  'sessioncam.com': 'session_replay',
  'contentsquare.net': 'session_replay',
  'quantummetric.com': 'session_replay',
  'crazyegg.com': 'session_replay',

  // Chat and call tracking.
  'cdn.callrail.com': 'functional',
  'js.callrail.com': 'functional',
  'api.callrail.com': 'functional',
  'widget.callrail.com': 'functional',
  'calltrk.com': 'functional',
}

/**
 * Reduce anything URL-shaped to a lowercase "host/path" string for matching.
 *
 * Absolute, protocol-relative and relative URLs all arrive here, sometimes as a
 * URL object and sometimes as whatever a third-party script happened to pass.
 * It must never throw: this runs on every network call the page makes, and an
 * exception would take the site down rather than block a tracker.
 */
export function normalizeUrl(url: unknown): string {
  if (url == null) return ''
  let s = String(url)
  if (s === '') return ''
  s = s.replace(/^[a-z][a-z0-9+.-]*:/i, '') // strip "https:" and friends
  s = s.replace(/^\/\//, '') // strip protocol-relative slashes
  s = s.split('#')[0].split('?')[0] // query and fragment are not part of the host or path
  return s.toLowerCase()
}

/**
 * The category a URL belongs to, or '' when it is first party or simply not a
 * tracker we know about.
 *
 * Unknown third parties are deliberately allowed. A blocklist that guesses would
 * eventually block a font or a map and break a page, and the failure would look
 * like a bug in the site rather than a privacy control doing its job.
 */
export function classifyUrl(url: unknown, blocklist: Record<string, string> = DEFAULT_BLOCKLIST): string {
  const hostpath = normalizeUrl(url)
  if (hostpath === '') return ''
  for (const key of Object.keys(blocklist)) {
    if (hostpath.indexOf(key) !== -1) return blocklist[key]
  }
  return ''
}

/**
 * Marketing consent has to be an affirmative act, so a newsletter or SMS box
 * may not arrive already ticked. These two patterns decide which boxes that
 * rule applies to.
 *
 * The exclusion list matters more than the match list. Terms and conditions,
 * privacy policy and "remember me" are all consent of a sort and none of them
 * are marketing consent, so unticking them would be both wrong and annoying.
 */
const MARKETING_RE =
  /(sms|text\s*message|txt\s*msg|mobile\s*(?:updates|alerts|offers)|newsletter|subscribe|marketing|promotion|promotional|special\s*offers|email\s*updates|mailing\s*list|opt[\s\-_]?in)/i

const EXCLUDE_RE = /(terms|conditions|privacy\s*policy|remember\s*me|captcha|hidden|agree\s*to\s*the)/i

/**
 * Whether a checkbox, described by its combined name/id/class/label text, is a
 * marketing opt-in that must not ship pre-ticked.
 */
export function isMarketingConsentField(text: string | null | undefined): boolean {
  if (!text) return false
  if (EXCLUDE_RE.test(text)) return false
  return MARKETING_RE.test(text)
}

/** A stored consent record, as written to the cookie. */
export interface ConsentState {
  /** Schema version of this record, not the policy version. */
  v: number
  necessary: 1
  analytics: 0 | 1
  advertising: 0 | 1
  functional: 0 | 1
  session_replay: 0 | 1
  /** Whether Global Privacy Control was in force when this was written. */
  gpc: 0 | 1
  /** The policy version in force. A change here re-asks everyone. */
  policy: number
  /** How the record came about, so a dismissal is never read as an acceptance. */
  action: 'accept' | 'reject' | 'custom' | 'gpc'
  /** Unix seconds. Records when the visitor actually chose. */
  ts: number
}

/** The name of the first-party cookie holding the record above. */
export const CONSENT_COOKIE = 'privacy_choices_consent'

/**
 * Whether a path is one where health information is collected.
 *
 * On these pages no advertising, analytics or recording tag may fire at all,
 * whatever the visitor has previously agreed to, and Tag Manager is not loaded.
 * Consent does not make it lawful to disclose that someone was reading about a
 * medical condition, so the visitor is not offered the choice in the first place.
 *
 * Matching is prefix-based on the pathname, so "/contact" also covers
 * "/contact/anything". Empty or absent configuration means no page is treated
 * this way, which is the correct default for a site that collects none.
 */
export function isHealthIntentPath(pathname: string, paths: string[] | undefined | null): boolean {
  if (!paths || !paths.length) return false
  const clean = '/' + String(pathname || '/').replace(/^\/+/, '').replace(/\/+$/, '')
  for (const raw of paths) {
    const p = String(raw || '').trim()
    if (!p) continue
    const norm = '/' + p.replace(/^\/+/, '').replace(/\/+$/, '')
    if (norm === '/') continue // "/" would mean the whole site; treat as unset
    if (clean === norm || clean.startsWith(norm + '/')) return true
  }
  return false
}
