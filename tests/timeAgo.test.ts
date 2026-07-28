import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { timeAgo, timeAgoOr } from '../app/lib/timeAgo.ts'

const now = new Date('2026-07-28T12:00:00Z')
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('timeAgo', () => {
  test('very recent reads as just now', () => {
    assert.equal(timeAgo(ago(5 * SECOND), now), 'just now')
    assert.equal(timeAgo(ago(40 * SECOND), now), 'just now')
  })

  test('around a minute', () => {
    assert.equal(timeAgo(ago(60 * SECOND), now), 'a minute ago')
    assert.equal(timeAgo(ago(5 * MINUTE), now), '5 minutes ago')
  })

  test('hours', () => {
    assert.equal(timeAgo(ago(90 * MINUTE), now), 'an hour ago')
    assert.equal(timeAgo(ago(5 * HOUR), now), '5 hours ago')
  })

  test('yesterday and days', () => {
    assert.equal(timeAgo(ago(30 * HOUR), now), 'yesterday')
    assert.equal(timeAgo(ago(5 * DAY), now), '5 days ago')
  })

  test('past a month it gives a date instead of a large day count', () => {
    const result = timeAgo(ago(90 * DAY), now)
    assert.match(result!, /^on /)
    assert.doesNotMatch(result!, /days ago/)
  })

  test('singular and plural are both right', () => {
    assert.equal(timeAgo(ago(2 * MINUTE), now), '2 minutes ago')
    assert.equal(timeAgo(ago(2 * DAY + HOUR), now), '2 days ago')
  })

  test('a timestamp in the future does not read as negative', () => {
    // Server and browser clocks disagree often enough to matter.
    assert.equal(timeAgo(new Date(now.getTime() + 5 * MINUTE).toISOString(), now), 'just now')
  })

  test('missing or unparseable input returns null rather than throwing', () => {
    assert.equal(timeAgo(null, now), null)
    assert.equal(timeAgo(undefined, now), null)
    assert.equal(timeAgo('not a date', now), null)
  })

  test('timeAgoOr supplies a fallback', () => {
    assert.equal(timeAgoOr(null, 'never', now), 'never')
    assert.equal(timeAgoOr(ago(5 * MINUTE), 'never', now), '5 minutes ago')
  })
})
