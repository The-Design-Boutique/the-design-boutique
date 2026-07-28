import assert from 'node:assert/strict'
import { test } from 'node:test'

import { canSubmit, singleHost, INDEXNOW_ENGINES } from '../app/lib/indexNow.ts'

test('Google is not an IndexNow engine, and the list says so', () => {
  // The whole point of keeping this list explicit. Somebody will eventually
  // assume this button gets a page into Google; it never can.
  assert.equal((INDEXNOW_ENGINES as readonly string[]).includes('Google'), false)
  assert.equal((INDEXNOW_ENGINES as readonly string[]).includes('Bing'), true)
})

test('finds the host when every address agrees', () => {
  assert.equal(
    singleHost(['https://example.com/a', 'https://example.com/b/']),
    'example.com',
  )
})

test('refuses a mixed batch rather than guessing', () => {
  assert.equal(singleHost(['https://example.com/a', 'https://other.com/b']), null)
})

test('refuses anything that is not a real address', () => {
  assert.equal(singleHost(['not a url']), null)
})

test('accepts addresses on the host that serves the key file', () => {
  const result = canSubmit(['https://example.com/about/'], 'example.com')
  assert.equal(result.ok, true)
})

test('refuses addresses on a different host, and explains which', () => {
  // This is the live case today: the panel shows thedesignboutique.com URLs
  // while the key file is served from staging. IndexNow would answer 422 with
  // no explanation, so the refusal is produced here instead.
  const result = canSubmit(['https://thedesignboutique.com/about/'], 'the-design-boutique.vercel.app')
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.match(result.reason, /the-design-boutique\.vercel\.app/)
    assert.match(result.reason, /thedesignboutique\.com/)
  }
})

test('refuses an empty submission', () => {
  const result = canSubmit([], 'example.com')
  assert.equal(result.ok, false)
})
