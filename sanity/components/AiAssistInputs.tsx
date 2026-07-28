'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Card, Code, Flex, Select, Stack, Text, TextInput } from '@sanity/ui'
import { set, unset, useFormValue, type ObjectInputProps, type StringInputProps } from 'sanity'
import {
  ANTHROPIC_MODELS,
  OPENAI_MODEL_HELP,
  PROVIDER_KEY_URLS,
  formatCostPerSuggestion,
  type AiProvider,
} from '../../app/lib/seo/aiModels'

/* eslint-disable @typescript-eslint/no-explicit-any */

function useProvider(): AiProvider {
  const provider = useFormValue(['aiAssist', 'provider']) as string | undefined
  return provider === 'openai' ? 'openai' : 'anthropic'
}

/**
 * Model picker.
 *
 * Anthropic models are offered as a list because we can keep that list
 * accurate. OpenAI models are typed in from the account's own dashboard: a
 * stale dropdown that names a retired model would fail at first use with a
 * confusing error, which is worse than asking someone to paste an id.
 */
export function AiModelInput(props: StringInputProps) {
  const provider = useProvider()
  const { onChange, value } = props

  const selected = useMemo(() => ANTHROPIC_MODELS.find((m) => m.id === value), [value])

  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.currentTarget.value
      onChange(next ? set(next) : unset())
    },
    [onChange],
  )

  if (provider === 'openai') {
    return (
      <Stack space={3}>
        {props.renderDefault(props)}
        <Text size={1} muted>
          {OPENAI_MODEL_HELP}
        </Text>
      </Stack>
    )
  }

  return (
    <Stack space={3}>
      <Select value={value || ''} onChange={handleSelect}>
        <option value="">Choose a model</option>
        {ANTHROPIC_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </Select>
      {selected ? (
        <Card padding={3} radius={2} tone="transparent" border>
          <Stack space={2}>
            <Text size={1}>{selected.note}</Text>
            <Text size={1} weight="semibold">
              Estimated cost: {formatCostPerSuggestion(selected)}
            </Text>
            <Text size={0} muted>
              An estimate based on a typical suggestion. Providers publish their own prices and change
              them from time to time. You are only charged when someone presses Suggest.
            </Text>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  )
}

interface StoredKey {
  ciphertext?: string
  hint?: string
  updatedAt?: string
}

/**
 * API key entry.
 *
 * The key is sent to the server, encrypted there against a secret that exists
 * only in the server environment, and only the encrypted form plus a masked
 * hint are stored. This matters because this dataset is public: anything stored
 * in plain text in a document can be read by anyone, so a raw key here would be
 * a published key.
 *
 * Once saved, the key cannot be read back, by us or by anyone else with Studio
 * access. To change it, paste a new one.
 */
export function AiKeyInput(props: ObjectInputProps) {
  const provider = useProvider()
  const stored = (props.value || {}) as StoredKey
  const { onChange } = props

  const [entry, setEntry] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverReady, setServerReady] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/seo/ai-key')
      .then((r) => (r.ok ? r.json() : { canStoreKey: false }))
      .then((d) => {
        if (!cancelled) setServerReady(Boolean(d?.canStoreKey))
      })
      .catch(() => {
        if (!cancelled) setServerReady(false)
      })
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
      const res = await fetch('/api/seo/ai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Could not save the key.')
        return
      }
      onChange(
        set({
          ciphertext: data.ciphertext,
          hint: data.hint,
          updatedAt: new Date().toISOString(),
        }),
      )
      setEntry('')
    } catch {
      setError('Could not reach the server to save the key.')
    } finally {
      setBusy(false)
    }
  }, [entry, provider, onChange])

  const remove = useCallback(() => {
    onChange(unset())
    setEntry('')
    setError(null)
  }, [onChange])

  const saved = Boolean(stored.ciphertext)

  return (
    <Stack space={3}>
      {saved ? (
        <Card padding={3} radius={2} tone="positive" border>
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Badge tone="positive" fontSize={0}>
                Key saved
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
              Only the opening characters are shown. The rest cannot be read back by anyone, including
              us. To replace it, paste a new key below.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Card padding={3} radius={2} tone="caution" border>
          <Text size={1}>
            No key saved. The writing assistant stays switched off, and the checks and readability
            panel keep working exactly as they do now.
          </Text>
        </Card>
      )}

      {serverReady === false ? (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>
            The server is not set up to store a key yet. SEO_AI_SECRET needs to be added to the
            environment first. Until then this field cannot save anything.
          </Text>
        </Card>
      ) : null}

      <Flex gap={2}>
        <Box flex={1}>
          <TextInput
            type="password"
            autoComplete="off"
            placeholder={saved ? 'Paste a new key to replace the current one' : 'Paste your API key'}
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
        {saved ? <Button text="Remove" mode="ghost" tone="critical" onClick={remove} disabled={busy} /> : null}
      </Flex>

      {error ? (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>{error}</Text>
        </Card>
      ) : null}

      <Text size={0} muted>
        Create a key at <a href={PROVIDER_KEY_URLS[provider]} target="_blank" rel="noreferrer">{PROVIDER_KEY_URLS[provider]}</a>.
        Usage is billed to whichever account the key belongs to.
      </Text>
    </Stack>
  )
}
