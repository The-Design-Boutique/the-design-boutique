/**
 * Server-only handling of the writing-assistance API key.
 *
 * SERVER ONLY. Never import this from a Studio component or any file that ends
 * up in the browser bundle.
 *
 * Why this exists at all: the `production` dataset is public. An unauthenticated
 * request to the Sanity API returns documents, and the project id ships in the
 * frontend bundle, so anything written into a document is world readable. A raw
 * API key stored in Site Settings would therefore be published, and ruleset 05
 * rule 20 requires that the key never reach the browser.
 *
 * So the key is encrypted here, with a secret that lives only in the server
 * environment, and only the ciphertext plus a masked hint are stored in Sanity.
 * Anyone reading the public dataset gets ciphertext they cannot open.
 *
 * The plaintext does pass through the browser once, at the moment an editor
 * types it into the settings form. That is true of every "paste your key here"
 * form on the web and is not something encryption at rest changes.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16

/**
 * Fixed salt. The secret itself supplies the entropy; a per-value salt would
 * have to be stored next to the ciphertext and buys nothing here.
 */
const SALT = 'tdb-seo-ai-key-v1'

export class MissingSecretError extends Error {
  constructor() {
    super(
      'SEO_AI_SECRET is not set. Generate one with `openssl rand -hex 32` and add it to the environment before saving an API key.',
    )
    this.name = 'MissingSecretError'
  }
}

function derivedKey(): Buffer {
  const secret = process.env.SEO_AI_SECRET
  if (!secret || secret.length < 16) throw new MissingSecretError()
  return scryptSync(secret, SALT, 32)
}

/** True when the server is configured to store a key at all. */
export function canStoreKey(): boolean {
  const secret = process.env.SEO_AI_SECRET
  return Boolean(secret && secret.length >= 16)
}

/**
 * Mask a key for display: the opening characters, which identify the provider
 * and the account, then asterisks. The remainder is never shown again once
 * saved, and the run of asterisks is a fixed length so it does not leak how
 * long the key is.
 */
export function maskKey(plaintext: string): string {
  const visible = plaintext.slice(0, 10)
  return `${visible}${'*'.repeat(24)}`
}

export function encryptKey(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, derivedKey(), iv)
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, body]).toString('base64')
}

export function decryptKey(stored: string): string {
  const raw = Buffer.from(stored, 'base64')
  const iv = raw.subarray(0, IV_BYTES)
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const body = raw.subarray(IV_BYTES + TAG_BYTES)
  const decipher = createDecipheriv(ALGORITHM, derivedKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8')
}

/**
 * Basic shape check before we store anything, so an editor who pastes the
 * wrong string finds out immediately rather than at first use.
 */
export function looksLikeKey(provider: string, key: string): { ok: true } | { ok: false; reason: string } {
  const k = key.trim()
  if (k.length < 20) return { ok: false, reason: 'That looks too short to be an API key.' }
  if (/\s/.test(k)) return { ok: false, reason: 'An API key should not contain spaces or line breaks.' }
  if (provider === 'anthropic' && !k.startsWith('sk-ant-')) {
    return { ok: false, reason: 'An Anthropic key starts with "sk-ant-". Check you copied the whole key.' }
  }
  if (provider === 'openai' && !k.startsWith('sk-')) {
    return { ok: false, reason: 'An OpenAI key starts with "sk-". Check you copied the whole key.' }
  }
  return { ok: true }
}
