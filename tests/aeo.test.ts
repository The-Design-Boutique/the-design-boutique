import assert from 'node:assert/strict'
import { test } from 'node:test'

import { analyseAeo } from '../app/lib/aeo.ts'

/** A document shaped the way the page builder produces them. */
function docWith(blocks: unknown[], extra: Record<string, unknown> = {}) {
  return { _type: 'page', title: 'Branding', pageBuilder: blocks, ...extra }
}

function richText(paragraphs: string[], headings: string[] = []) {
  return {
    _type: 'richText',
    heading: headings[0],
    body: paragraphs.map((text) => ({
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text }],
    })),
  }
}

const LONG = Array.from({ length: 60 }, (_, i) => `Sentence number ${i} about branding work.`).join(' ')

function check(analysis: ReturnType<typeof analyseAeo>, id: string) {
  const found = analysis.checks.find((c) => c.id === id)
  assert.ok(found, `expected a check called ${id}`)
  return found!
}

test('a greeting is not an answer', () => {
  const a = analyseAeo(docWith([richText(['Welcome to our website, we are so glad you are here and hope you enjoy looking around today.'])]))
  assert.equal(check(a, 'answer-up-front').status, 'warn')
})

test('an opening that says something scores', () => {
  const opener = 'We design brands for law firms and wineries in San Francisco, covering identity, website design and the search work that follows it.'
  const a = analyseAeo(docWith([richText([opener])]))
  assert.equal(check(a, 'answer-up-front').status, 'pass')
})

test('a page with no paragraphs fails rather than passing quietly', () => {
  const a = analyseAeo(docWith([]))
  assert.equal(check(a, 'answer-up-front').status, 'fail')
})

test('recognises question headings both by shape and by opening word', () => {
  const a = analyseAeo(
    docWith([
      richText(['Some copy about pricing that runs on for a while.'], ['How much does branding cost']),
      richText(['More copy about timing.'], ['What happens after the launch?']),
    ]),
  )
  assert.equal(check(a, 'question-headings').status, 'pass')
})

test('statement headings do not count as questions', () => {
  const a = analyseAeo(
    docWith([
      richText(['Copy.'], ['Our pricing']),
      richText(['Copy.'], ['Our process']),
    ]),
  )
  assert.equal(check(a, 'question-headings').status, 'fail')
})

test('a FAQ passes whether it comes from a block or the schema type', () => {
  const viaOption = analyseAeo(docWith([]), { hasFaqBlock: true })
  assert.equal(check(viaOption, 'faq').status, 'pass')

  const viaSchema = analyseAeo(docWith([]), { schemaType: 'FAQPage' })
  assert.equal(check(viaSchema, 'faq').status, 'pass')
})

test('thin pages are marked thin', () => {
  const a = analyseAeo(docWith([richText(['Only a few words here.'])]))
  assert.equal(check(a, 'substance').status, 'fail')
})

test('attribution only applies to posts', () => {
  const page = analyseAeo(docWith([]), { documentType: 'page' })
  assert.equal(check(page, 'attribution').status, 'skipped')

  const post = analyseAeo(docWith([]), { documentType: 'post', hasAuthor: true, hasDate: true })
  assert.equal(check(post, 'attribution').status, 'pass')

  const undated = analyseAeo(docWith([]), { documentType: 'post', hasAuthor: true, hasDate: false })
  assert.equal(check(undated, 'attribution').status, 'fail')
  assert.match(check(undated, 'attribution').detail, /a date/)
})

test('a skipped check does not drag the score down', () => {
  // The whole point of skipping rather than failing: a page cannot be penalised
  // for lacking an author it was never supposed to have.
  const page = analyseAeo(docWith([]), { documentType: 'page' })
  assert.equal(check(page, 'attribution').weight, 0)
  assert.ok(page.score >= 0 && page.score <= 100)
})

test('a generic schema type is a nudge, not a failure', () => {
  const generic = analyseAeo(docWith([]), { schemaType: 'WebPage' })
  assert.equal(check(generic, 'schema-specific').status, 'warn')

  const specific = analyseAeo(docWith([]), { schemaType: 'Service' })
  assert.equal(check(specific, 'schema-specific').status, 'pass')
})

test('a well built page scores well and a bare one does not', () => {
  const good = analyseAeo(
    docWith([
      richText([
        'We design brands for law firms and wineries in San Francisco, covering identity, website design and the search work that follows.',
        LONG,
      ], ['What we do']),
      richText([LONG], ['How much does it cost?']),
      richText([LONG], ['How long does a project take?']),
    ]),
    { documentType: 'page', schemaType: 'Service', hasFaqBlock: true },
  )
  assert.ok(good.score >= 80, `expected a good score, got ${good.score}`)
  assert.equal(good.band, 'good')

  const bare = analyseAeo(docWith([richText(['Hello.'])]), { documentType: 'page' })
  assert.ok(bare.score < 50, `expected a poor score, got ${bare.score}`)
})
