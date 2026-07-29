import { CONSENT_ENGINE_SRC } from '@/app/lib/consentEngine'
import { CATEGORIES, CONSENT_COOKIE, DEFAULT_BLOCKLIST, type Category } from '@/app/lib/consent'

/**
 * The consent gate, emitted ahead of everything that could track anybody.
 *
 * Two scripts, and the order of them is the whole point. First Google's consent
 * defaults, all denied, because Google requires that signal to arrive before its
 * tags do and treats a late one as no signal at all. Then the gate itself, which
 * replaces the browser's network primitives so that anything not covered by
 * Google's scheme is stopped as well.
 *
 * Both are inline and synchronous. A deferred script, a bundled module or
 * anything waiting on hydration would run after the first tag has already
 * fired, and a privacy control that arrives second is decoration.
 *
 * The cost is about thirteen kilobytes of blocking script in the document. That
 * is a real cost on a site deliberately taken from 57 to 91 on a phone, and it
 * is the correct trade: the alternative is not a faster site, it is a site that
 * tracks people who said no.
 *
 * Note that an absent settings object counts as switched on. The gate has to be
 * something you turn off deliberately, because the failure mode of the opposite
 * default is silent, invisible, and only discovered by whoever audits the site.
 */

export interface PrivacySettings {
  enabled?: boolean
  heading?: string
  body?: string
  policyVersion?: number
  cookieDays?: number
  honorGpc?: boolean
  offerSessionRecording?: boolean
  privacyPolicyUrl?: string
  cookiePolicyUrl?: string
  linkText?: string
  extraBlocklist?: string
  healthIntentPaths?: string[]
}

/**
 * Parse the "host = category" lines from settings into blocklist entries.
 *
 * Anything malformed is skipped rather than guessed at. A typo that silently
 * became a rule blocking half the site would be far worse than a typo that
 * simply does nothing.
 */
export function parseExtraBlocklist(raw: string | undefined | null): Record<string, Category> {
  const out: Record<string, Category> = {}
  if (!raw) return out
  for (const line of String(raw).split(/\r\n|\r|\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.indexOf('=') === -1) continue
    const [hostRaw, catRaw] = trimmed.split('=', 2)
    const host = hostRaw.trim().toLowerCase()
    const cat = catRaw.trim().toLowerCase()
    if (!host) continue
    if ((CATEGORIES as readonly string[]).includes(cat)) out[host] = cat as Category
  }
  return out
}

export function ConsentScripts({
  privacy,
  hardBlock,
}: {
  privacy?: PrivacySettings
  /** True on a page that collects health information. */
  hardBlock?: boolean
}) {
  if (privacy?.enabled === false) return null

  // An absent object is a configured-nothing, not a reason to skip the gate.
  const opts: PrivacySettings = privacy ?? {}

  const categories: Category[] = opts.offerSessionRecording === false
    ? ['analytics', 'advertising', 'functional']
    : [...CATEGORIES]

  const config = {
    cookieName: CONSENT_COOKIE,
    cookieDays: opts.cookieDays ?? 180,
    policyVersion: opts.policyVersion ?? 1,
    honorGpc: opts.honorGpc !== false,
    hardBlock: hardBlock === true,
    categories,
    // Merged here rather than in the engine, so the list has exactly one home
    // and that home is a file with tests next to it.
    blocklist: { ...DEFAULT_BLOCKLIST, ...parseExtraBlocklist(opts.extraBlocklist) },
  }

  return (
    <>
      {/*
        Denied by default, before Tag Manager exists. wait_for_update gives the
        visitor half a second to answer before Google's tags decide they were
        refused, which avoids losing a page view from somebody who accepts
        immediately without granting anything to somebody who does not.
      */}
      <script
        id="consent-default"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);`,
        }}
      />
      <script
        id="pcgate-config"
        dangerouslySetInnerHTML={{ __html: `window.PCGATE_CONFIG=${JSON.stringify(config)};` }}
      />
      <script id="pcgate-engine" dangerouslySetInnerHTML={{ __html: CONSENT_ENGINE_SRC }} />
    </>
  )
}
