import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeUrl,
  classifyUrl,
  isMarketingConsentField,
  isHealthIntentPath,
  DEFAULT_BLOCKLIST,
  CATEGORIES,
} from '../app/lib/consent.ts'

/**
 * Tests for the consent gate's classification logic.
 *
 * These matter more than most tests here because the code they cover runs on
 * every network request the page makes, and it fails in two opposite and
 * equally bad directions. Too eager and it blocks a font or a map, which looks
 * like the site is broken. Too slack and a tracker fires for somebody who said
 * no, which is the thing the whole feature exists to prevent.
 *
 * Ported from the plugin's tests/gate.test.cjs and tests/form-hygiene.test.cjs
 * so the two implementations can be checked against each other.
 */

describe('normalizeUrl', () => {
  test('strips the scheme, query and fragment', () => {
    assert.equal(normalizeUrl('https://example.com/a?b=1#c'), 'example.com/a')
  })

  test('handles protocol-relative URLs', () => {
    assert.equal(normalizeUrl('//connect.facebook.net/en_US/fbevents.js'), 'connect.facebook.net/en_us/fbevents.js')
  })

  test('lowercases, so a mixed-case host still matches', () => {
    assert.equal(normalizeUrl('HTTPS://Google-Analytics.COM/G/Collect'), 'google-analytics.com/g/collect')
  })

  test('never throws on the values a third-party script might pass', () => {
    for (const bad of [null, undefined, '', 0, {}, [], NaN, true]) {
      assert.doesNotThrow(() => normalizeUrl(bad))
    }
    assert.equal(normalizeUrl(null), '')
    assert.equal(normalizeUrl(undefined), '')
    assert.equal(normalizeUrl(''), '')
  })

  test('leaves a relative URL as a path', () => {
    assert.equal(normalizeUrl('/api/form/contact'), '/api/form/contact')
  })
})

describe('classifyUrl', () => {
  test('catches the Meta pixel by its endpoint, not the whole domain', () => {
    assert.equal(classifyUrl('https://www.facebook.com/tr?id=1&ev=PageView'), 'advertising')
    // A plain link to a Facebook page is not a tracker and must stay allowed.
    assert.equal(classifyUrl('https://www.facebook.com/thedesignboutique'), '')
  })

  test('catches every Clarity subdomain as session recording', () => {
    assert.equal(classifyUrl('https://www.clarity.ms/tag/abc'), 'session_replay')
    assert.equal(classifyUrl('https://z.clarity.ms/collect'), 'session_replay')
  })

  test('sorts the big three into the right categories', () => {
    assert.equal(classifyUrl('https://www.google-analytics.com/g/collect'), 'analytics')
    assert.equal(classifyUrl('https://connect.facebook.net/en_US/fbevents.js'), 'advertising')
    assert.equal(classifyUrl('https://cdn.callrail.com/companies/123/456/cr.js'), 'functional')
  })

  test('leaves first-party and unknown third-party URLs alone', () => {
    assert.equal(classifyUrl('https://thedesignboutique.com/about/'), '')
    assert.equal(classifyUrl('/api/form/contact'), '')
    assert.equal(classifyUrl('https://cdn.sanity.io/images/inapmf9l/production/x.jpg'), '')
    assert.equal(classifyUrl('https://fonts.gstatic.com/s/signika/v20/x.woff2'), '')
  })

  test('does not block Tag Manager itself', () => {
    // The container has to load: the gate governs what the container tries to
    // fire, which is a different thing from the container's own script.
    assert.equal(classifyUrl('https://www.googletagmanager.com/gtm.js?id=GTM-XXXX'), '')
  })

  test('honours an extra entry supplied through settings', () => {
    const withExtra = { ...DEFAULT_BLOCKLIST, 'widget.example.com': 'functional' }
    assert.equal(classifyUrl('https://widget.example.com/embed.js', withExtra), 'functional')
    // and the defaults still apply alongside it
    assert.equal(classifyUrl('https://clarity.ms/tag/x', withExtra), 'session_replay')
  })

  test('every default entry names a category the gate actually governs', () => {
    for (const [host, cat] of Object.entries(DEFAULT_BLOCKLIST)) {
      assert.ok(
        (CATEGORIES as readonly string[]).includes(cat),
        `${host} is mapped to "${cat}", which is not one of the gate's categories`,
      )
    }
  })
})

describe('isMarketingConsentField', () => {
  test('catches the boxes that must never arrive pre-ticked', () => {
    for (const text of [
      'newsletter',
      'Subscribe to our mailing list',
      'sms_optin',
      'Send me text message updates',
      'marketing_emails',
      'Yes, send me special offers',
      'opt-in',
    ]) {
      assert.equal(isMarketingConsentField(text), true, `expected "${text}" to be treated as marketing consent`)
    }
  })

  test('leaves the boxes that are not marketing consent alone', () => {
    for (const text of [
      'I agree to the terms and conditions',
      'privacy policy',
      'remember me',
      'captcha',
      'billing_same_as_shipping',
      'I have read the Privacy Policy',
    ]) {
      assert.equal(isMarketingConsentField(text), false, `expected "${text}" to be left untouched`)
    }
  })

  test('an exclusion beats a match, so a combined label is left alone', () => {
    // Real forms say things like "I agree to the terms and want the newsletter".
    // Unticking that would also revoke the terms acceptance, so it is skipped.
    assert.equal(isMarketingConsentField('I agree to the terms and to receive marketing'), false)
  })

  test('empty input is not a marketing field', () => {
    assert.equal(isMarketingConsentField(''), false)
    assert.equal(isMarketingConsentField(null), false)
    assert.equal(isMarketingConsentField(undefined), false)
  })
})

describe('isHealthIntentPath', () => {
  test('matches the page itself and anything beneath it', () => {
    assert.equal(isHealthIntentPath('/health-enquiry', ['/health-enquiry']), true)
    assert.equal(isHealthIntentPath('/health-enquiry/step-2', ['/health-enquiry']), true)
  })

  test('does not match a path that merely starts with the same letters', () => {
    assert.equal(isHealthIntentPath('/health-enquiry-results', ['/health-enquiry']), false)
  })

  test('is indifferent to leading and trailing slashes on either side', () => {
    assert.equal(isHealthIntentPath('/contact/', ['contact']), true)
    assert.equal(isHealthIntentPath('contact', ['/contact/']), true)
  })

  test('no configuration means no page is treated as health intent', () => {
    assert.equal(isHealthIntentPath('/anything', []), false)
    assert.equal(isHealthIntentPath('/anything', undefined), false)
    assert.equal(isHealthIntentPath('/anything', null), false)
  })

  test('a bare "/" entry is ignored rather than blocking the whole site', () => {
    // Someone typing "/" almost certainly did not mean "disable all tags
    // everywhere", and a setting that silently does that is a trap.
    assert.equal(isHealthIntentPath('/about', ['/']), false)
  })

  test('ignores blank lines in the configured list', () => {
    assert.equal(isHealthIntentPath('/about', ['', '   ']), false)
    assert.equal(isHealthIntentPath('/about', ['', '/about']), true)
  })
})
