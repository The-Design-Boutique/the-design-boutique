'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Box, Button, Card, Code, Flex, Stack, Text, TextInput } from '@sanity/ui'
import { set, unset, type ObjectInputProps } from 'sanity'

/**
 * A field for storing a third-party API key without publishing it.
 *
 * Documents in this dataset can be read from outside the Studio, so a key typed
 * into an ordinary text field would be a key anybody could read. The value is
 * sent to the server, encrypted there against a secret that exists only in the
 * server environment, and only the encrypted form plus the opening characters
 * are stored.
 *
 * One component serves any number of keys. Bind it to a service with
 * makeEncryptedKeyInput() below.
 */

interface StoredKey {
  ciphertext?: string
  hint?: string
  updatedAt?: string
}

export interface KeyConfig {
  /** Identifier sent to the encrypt route, used for its shape check. */
  service: string
  /** How the service is named in the interface. */
  serviceLabel: string
  /** Where an editor goes to obtain a key. */
  signupUrl?: string
}

/**
 * Build an input bound to one service. Sanity calls an input component with
 * its own props only, so configuration is closed over here rather than passed
 * through the schema, which also keeps it type checked.
 */
export function makeEncryptedKeyInput(config: KeyConfig) {
  function BoundKeyInput(props: ObjectInputProps) {
    return <EncryptedKeyInput {...props} config={config} />
  }
  BoundKeyInput.displayName = `EncryptedKeyInput(${config.service})`
  return BoundKeyInput
}

export function EncryptedKeyInput(props: ObjectInputProps & { config: KeyConfig }) {
  const options = props.config
  const service = options.service
  const label = options.serviceLabel
  const stored = (props.value || {}) as StoredKey
  const { onChange } = props

  const [entry, setEntry] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverReady, setServerReady] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/keys/encrypt')
      .then((r) => (r.ok ? r.json() : { canStoreKey: false }))
      .then((d) => !cancelled && setServerReady(Boolean(d?.canStoreKey)))
      .catch(() => !cancelled && setServerReady(false))
    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(async () => {
    const key = entry.trim()
    if (!key) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/keys/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, key }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Could not save the key.')
        return
      }
      onChange(set({ ciphertext: data.ciphertext, hint: data.hint, updatedAt: new Date().toISOString() }))
      setEntry('')
    } catch {
      setError('Could not reach the server to save the key.')
    } finally {
      setBusy(false)
    }
  }, [entry, service, onChange])

  const saved = Boolean(stored.ciphertext)

  return (
    <Stack space={3}>
      {saved ? (
        <Card padding={3} radius={2} tone="positive" border>
          <Stack space={2}>
            <Flex align="center" gap={2}>
              <Badge tone="positive" fontSize={0}>
                Connected
              </Badge>
              {stored.updatedAt ? (
                <Text size={0} muted>
                  Added {new Date(stored.updatedAt).toLocaleDateString()}
                </Text>
              ) : null}
            </Flex>
            <Box>
              <Code size={1}>{stored.hint || 'saved'}</Code>
            </Box>
            <Text size={1} muted>
              Only the opening characters are shown. The rest cannot be read back. Paste a new key to
              replace it.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Card padding={3} radius={2} tone="transparent" border>
          <Text size={1} muted>
            Not connected. This is optional: without it, the check simply does not run and everything
            else works as normal.
          </Text>
        </Card>
      )}

      {serverReady === false ? (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>
            The server cannot store keys yet. SEO_AI_SECRET needs adding to the environment first.
          </Text>
        </Card>
      ) : null}

      <Flex gap={2}>
        <Box flex={1}>
          <TextInput
            type="password"
            autoComplete="off"
            placeholder={saved ? `Paste a new ${label} key to replace it` : `Paste your ${label} key`}
            value={entry}
            disabled={busy || serverReady === false}
            onChange={(e) => setEntry(e.currentTarget.value)}
          />
        </Box>
        <Button
          text={busy ? 'Saving' : 'Save key'}
          tone="primary"
          disabled={!entry.trim() || busy || serverReady === false}
          onClick={save}
        />
        {saved ? (
          <Button text="Remove" mode="ghost" tone="critical" disabled={busy} onClick={() => onChange(unset())} />
        ) : null}
      </Flex>

      {error ? (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>{error}</Text>
        </Card>
      ) : null}

      {options.signupUrl ? (
        <Text size={0} muted>
          Keys come from{' '}
          <a href={options.signupUrl} target="_blank" rel="noreferrer">
            {options.signupUrl}
          </a>
          . Usage is billed to that account.
        </Text>
      ) : null}
    </Stack>
  )
}
