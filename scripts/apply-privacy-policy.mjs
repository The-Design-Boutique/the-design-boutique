/**
 * Replaces the Privacy Policy page's text with the reviewed draft.
 *
 * The page currently carries WordPress's default template, unedited, including
 * nine occurrences of the literal phrase "Suggested text:" that WordPress puts
 * there to be deleted. It describes comment forms, Gravatar and EXIF stripping,
 * none of which this site has, and says nothing about the tracking it does do.
 *
 * The replacement wording is in privacy-policy-content.mjs and leads with a
 * notice marking it as an unapproved draft, so nobody can mistake it for signed
 * off copy. Run this only once the client has agreed to it.
 *
 *   node --experimental-strip-types scripts/apply-privacy-policy.mjs
 *
 * Reads SANITY_API_WRITE_TOKEN and NEXT_PUBLIC_SANITY_DATASET from .env.local.
 * Prints what it will change and asks for confirmation before writing.
 */
import fs from 'node:fs'
import readline from 'node:readline/promises'

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const { POLICY } = await import('./privacy-policy-content.mjs')
const { createClient } = await import('next-sanity')

const client = createClient({
  projectId: 'inapmf9l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-02-19',
  useCdn: false,
  perspective: 'raw',
  token: process.env.SANITY_API_WRITE_TOKEN,
})

const doc = await client.fetch(`*[_id=='page.privacy-policy'][0]`)
if (!doc) throw new Error('page.privacy-policy not found')

const block = (doc.pageBuilder || []).find((b) => b._type === 'richText')
if (!block) throw new Error('no richText block on the privacy policy page')

const currentText = (block.content || [])
  .flatMap((b) => (b.children || []).map((s) => s.text))
  .join(' ')

console.log(`Current text: ${currentText.split(/\s+/).length} words`)
console.log(`Contains "Suggested text": ${currentText.includes('Suggested text')}`)
console.log(`Replacing with: ${POLICY.length} blocks\n`)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question('Replace the Privacy Policy text? (yes/no) ')
rl.close()
if (answer.trim().toLowerCase() !== 'yes') {
  console.log('Nothing changed.')
  process.exit(0)
}

await client
  .patch('page.privacy-policy')
  .set({ [`pageBuilder[_key=="${block._key}"].content`]: POLICY })
  .commit()

const after = await client.fetch(
  `*[_id=='page.privacy-policy'][0].pageBuilder[_type=='richText'][0].content`,
)
const newText = after.flatMap((b) => (b.children || []).map((s) => s.text)).join(' ')
console.log(`\nDone. ${after.length} blocks written.`)
console.log(`Still contains "Suggested text": ${newText.includes('Suggested text')}`)
