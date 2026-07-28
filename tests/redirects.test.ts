import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  flattenChains,
  normalisePath,
  notFoundId,
  shouldLogNotFound,
  validateRedirect,
  structuralRedirect,
  type RedirectRecord,
} from '../app/lib/redirects.ts'

/**
 * Tests for the redirect logic (SOW 2.5, ruleset 05 section 4).
 *
 * This logic runs in the proxy on live traffic, and its failure mode is a
 * visitor stuck in an infinite redirect loop, which is worse than the dead
 * link it was meant to fix. The loop cases below are the reason this file
 * exists.
 *
 * Run with `npm test`.
 */

const r = (from: string, to: string, enabled = true): RedirectRecord => ({
  _id: from,
  fromPath: from,
  toPath: to,
  statusCode: 301,
  enabled,
})

describe('normalisePath', () => {
  test('strips a trailing slash but keeps the root', () => {
    assert.equal(normalisePath('/about/'), '/about')
    assert.equal(normalisePath('/'), '/')
  })

  test('accepts a full URL pasted from a browser bar', () => {
    assert.equal(normalisePath('https://thedesignboutique.com/Old-Page/'), '/old-page')
  })

  test('drops the query string and fragment', () => {
    assert.equal(normalisePath('/a?utm_source=x#top'), '/a')
  })

  test('adds a leading slash and collapses repeats', () => {
    assert.equal(normalisePath('about'), '/about')
    assert.equal(normalisePath('//a//b'), '/a/b')
  })

  test('lowercases, because the old WordPress site was case insensitive', () => {
    assert.equal(normalisePath('/About/Team'), '/about/team')
  })
})

describe('shouldLogNotFound', () => {
  test('ignores bot and scanner noise', () => {
    assert.equal(shouldLogNotFound('/wp-login.php'), false)
    assert.equal(shouldLogNotFound('/.env'), false)
    assert.equal(shouldLogNotFound('/xmlrpc.php'), false)
  })

  test('ignores asset requests, which are a content bug not a redirect', () => {
    assert.equal(shouldLogNotFound('/img/logo.png'), false)
    assert.equal(shouldLogNotFound('/styles/main.css'), false)
  })

  test('logs a real page someone tried to reach', () => {
    assert.equal(shouldLogNotFound('/old-services'), true)
  })

  test('never logs the root', () => {
    assert.equal(shouldLogNotFound('/'), false)
  })
})

describe('flattenChains', () => {
  test('collapses a chain so a visitor takes one hop, not two', () => {
    const map = flattenChains([r('/a', '/b'), r('/b', '/c')])
    assert.equal(map.get('/a')?.toPath, '/c')
    assert.equal(map.get('/b')?.toPath, '/c')
  })

  test('survives a cycle instead of hanging', () => {
    const map = flattenChains([r('/a', '/b'), r('/b', '/a')])
    // The exact resolution matters less than terminating and never
    // producing a redirect that points at its own source.
    for (const [from, record] of map) assert.notEqual(record.toPath, from)
  })

  test('drops a redirect that points at itself', () => {
    assert.equal(flattenChains([r('/a', '/a')]).has('/a'), false)
  })

  test('ignores disabled redirects', () => {
    assert.equal(flattenChains([r('/a', '/b', false)]).size, 0)
  })

  test('leaves an external target alone', () => {
    const map = flattenChains([r('/a', 'https://example.com/x')])
    assert.equal(map.get('/a')?.toPath, 'https://example.com/x')
  })

  test('normalises stored paths so matching is consistent', () => {
    const map = flattenChains([r('/Old-Page/', '/New-Page/')])
    assert.equal(map.get('/old-page')?.toPath, '/new-page')
  })
})

describe('validateRedirect', () => {
  test('refuses a redirect pointing at itself', () => {
    assert.equal(validateRedirect('/a', '/a', []).ok, false)
  })

  test('refuses to redirect the site root', () => {
    assert.equal(validateRedirect('/', '/a', []).ok, false)
  })

  test('refuses a duplicate source path', () => {
    assert.equal(validateRedirect('/a', '/z', [r('/a', '/b')]).ok, false)
  })

  test('refuses a redirect that would close a loop', () => {
    // /a -> /b -> /c already exists. Adding /c -> /a closes the circle.
    assert.equal(validateRedirect('/c', '/a', [r('/a', '/b'), r('/b', '/c')]).ok, false)
  })

  test('allows a straightforward new redirect', () => {
    assert.equal(validateRedirect('/old', '/new', []).ok, true)
  })

  test('allows an external destination', () => {
    assert.equal(validateRedirect('/old', 'https://example.com', []).ok, true)
  })

  test('ignores the redirect being edited when checking for duplicates', () => {
    const existing = [r('/a', '/b')]
    assert.equal(validateRedirect('/a', '/c', existing, '/a').ok, true)
  })
})

describe('notFoundId', () => {
  test('is stable for the same path on the same day, so hits aggregate', () => {
    assert.equal(notFoundId('/a/b', '2026-07-27'), notFoundId('/a/b', '2026-07-27'))
  })

  test('differs by day, so each day is counted separately', () => {
    assert.notEqual(notFoundId('/a/b', '2026-07-27'), notFoundId('/a/b', '2026-07-28'))
  })

  test('produces a usable id from an awkward path', () => {
    const id = notFoundId('/a b/c%20d/!!', '2026-07-27')
    assert.match(id, /^notFound\.2026-07-27\.[a-z0-9-]+$/)
  })
})

describe('structural redirects', () => {
  test('sends /blog/{slug} to /{slug}, matching the live site', () => {
    // Verified against thedesignboutique.com, which 301s every one of these.
    const r = structuralRedirect('/blog/jungle')
    assert.ok(r)
    assert.equal(r!.toPath, '/jungle')
    assert.equal(r!.statusCode, 301)
  })

  test('leaves the blog index alone', () => {
    // /blog is a real page. Redirecting it to / would remove the blog.
    assert.equal(structuralRedirect('/blog'), null)
    assert.equal(structuralRedirect('/blog/'), null)
  })

  test('ignores anything that is not a blog path', () => {
    assert.equal(structuralRedirect('/about'), null)
    assert.equal(structuralRedirect('/portfolio/gloria-ferrer'), null)
    assert.equal(structuralRedirect('/'), null)
  })

  test('carries no document id, so hits are not counted against one', () => {
    // The proxy checks this before trying to patch a document that does not exist.
    assert.equal(structuralRedirect('/blog/jungle')!._id, '')
  })
})
