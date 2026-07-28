/**
 * The models the writing-assistance layer can be pointed at, and what they cost.
 *
 * Shown in Site Settings so whoever turns the feature on can see the price
 * before they do (ruleset 05, rule 21: this is the one feature in 2.5 with a
 * per-use cost, and it must not run on someone's dime unexamined).
 *
 * Prices are US dollars per million tokens, as published by each provider.
 * They change; the estimate in the Studio is labelled as an estimate.
 */

export type AiProvider = 'anthropic' | 'openai'

export interface AiModelOption {
  id: string
  title: string
  /** USD per million input tokens. */
  inputPerMTok: number
  /** USD per million output tokens. */
  outputPerMTok: number
  note: string
}

/**
 * Anthropic model IDs, current as of July 2026. These are exact strings; they
 * carry no date suffix.
 */
export const ANTHROPIC_MODELS: AiModelOption[] = [
  {
    id: 'claude-opus-5',
    title: 'Claude Opus 5 (recommended)',
    inputPerMTok: 5,
    outputPerMTok: 25,
    note: 'Best writing quality. The suggestions here are short, so the cost per use stays under a penny.',
  },
  {
    id: 'claude-sonnet-5',
    title: 'Claude Sonnet 5',
    inputPerMTok: 3,
    outputPerMTok: 15,
    note: 'Faster and cheaper, still strong on short copy.',
  },
  {
    id: 'claude-haiku-4-5',
    title: 'Claude Haiku 4.5',
    inputPerMTok: 1,
    outputPerMTok: 5,
    note: 'Cheapest. Fine for length trimming, weaker at persuasive copy.',
  },
]

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
}

/** Where to get a key, shown next to the key field. */
export const PROVIDER_KEY_URLS: Record<AiProvider, string> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
}

/**
 * OpenAI model IDs are entered by hand rather than picked from a list.
 * We publish a list only where we can keep it accurate; a stale dropdown that
 * silently names a retired model is worse than a box the account holder fills
 * in from their own dashboard.
 */
export const OPENAI_MODEL_HELP =
  'Enter the model ID exactly as it appears in your OpenAI dashboard, for example gpt-5.'

export function modelsForProvider(provider: AiProvider): AiModelOption[] {
  return provider === 'anthropic' ? ANTHROPIC_MODELS : []
}

/**
 * A rough cost for one suggestion, used for the "about $X per suggestion" line.
 * Assumes the typical request this feature makes: the page's existing copy in,
 * a sentence or two out.
 */
export const TYPICAL_REQUEST = { inputTokens: 800, outputTokens: 120 } as const

export function estimateCostPerSuggestion(model: AiModelOption): number {
  return (
    (TYPICAL_REQUEST.inputTokens / 1_000_000) * model.inputPerMTok +
    (TYPICAL_REQUEST.outputTokens / 1_000_000) * model.outputPerMTok
  )
}

export function formatCostPerSuggestion(model: AiModelOption): string {
  const cost = estimateCostPerSuggestion(model)
  // Fractions of a cent are the normal case; say so in a way a human reads.
  if (cost < 0.01) return `about ${(cost * 100).toFixed(1)} cents per suggestion`
  return `about $${cost.toFixed(2)} per suggestion`
}
