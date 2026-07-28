/**
 * The rules behind Forms by Angelo: which questions show, how a form splits
 * into steps, where a step goes next, and whether an answer is acceptable.
 *
 * Kept free of imports and of React so it can be unit tested directly. The
 * renderer and the submission route both use it, which matters: a field hidden
 * by a condition in the browser must also be treated as hidden by the server,
 * or a visitor gets rejected for not answering a question they never saw.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type FormValues = Record<string, unknown>

export interface FormField {
  _type: string
  _key?: string
  label?: string
  name?: string
  required?: boolean
  width?: string
  conditionalField?: string
  conditionalOperator?: string
  conditionalValue?: string
  options?: Array<{ label?: string; value?: string }>
  min?: number
  max?: number
  // Presentation and behaviour, declared so the renderer does not have to cast
  // its way through every field it draws.
  placeholder?: string
  helpText?: string
  hideLabel?: boolean
  autoAdvance?: boolean
  rows?: number
  numberFormat?: string
  enableSelectAll?: boolean
  showMiddleName?: boolean
  showLine2?: boolean
  validateTrigger?: string
  cityFieldName?: string
  stateFieldName?: string
  defaultValue?: string
  stepLabel?: string
  heading?: string
  description?: string
  consentText?: unknown
  content?: unknown
  [key: string]: unknown
}

export interface RoutingRule {
  afterStep?: number
  field?: string
  operator?: string
  value?: string
  goToStep?: number
}

/** Field types that collect an answer, as opposed to laying the form out. */
const INPUT_TYPES = new Set([
  'textField', 'emailField', 'phoneField', 'numberField', 'textareaField',
  'selectField', 'multiSelectField', 'radioField', 'checkboxField', 'dateField',
  'nameField', 'addressField', 'zipLookupField', 'consentField', 'hiddenField',
])

export const isInputField = (field: FormField): boolean => INPUT_TYPES.has(field._type)

/**
 * The key an answer is stored under. Editors may leave Field Name blank, in
 * which case it comes from the label, so a form works without them having to
 * think about identifiers at all.
 */
export function fieldName(field: FormField, index = 0): string {
  const explicit = (field.name || '').trim()
  if (explicit) return explicit
  const fromLabel = (field.label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return fromLabel || `field_${index + 1}`
}

/** An answer counts as empty when there is nothing a person would call an answer. */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'boolean') return value === false
  if (typeof value === 'object') return Object.values(value as object).every(isEmptyValue)
  return false
}

function asComparable(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map((v) => String(v)).join(',')
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

export function matchesCondition(value: unknown, operator: string | undefined, target: string | undefined): boolean {
  const left = asComparable(value).trim().toLowerCase()
  const right = (target || '').trim().toLowerCase()

  switch (operator) {
    case 'not_equals':
      return left !== right
    case 'contains':
      // A multi-select holds several answers; "contains" should match any one
      // of them exactly rather than doing a loose substring match across the
      // joined string, which would let "no" match "north".
      if (Array.isArray(value)) return value.map((v) => String(v).trim().toLowerCase()).includes(right)
      return left.includes(right)
    case 'is_empty':
      return isEmptyValue(value)
    case 'is_not_empty':
      return !isEmptyValue(value)
    case 'equals':
    default:
      return left === right
  }
}

/** Whether a field should be shown, given the answers so far. */
export function isVisible(field: FormField, values: FormValues): boolean {
  const dependsOn = (field.conditionalField || '').trim()
  if (!dependsOn) return true
  return matchesCondition(values[dependsOn], field.conditionalOperator, field.conditionalValue)
}

/**
 * Split the field list into steps on page breaks.
 *
 * A form with no page breaks is one step, which keeps the single-step case free
 * of special handling everywhere else.
 */
export function splitIntoSteps(fields: FormField[]): FormField[][] {
  const steps: FormField[][] = [[]]
  for (const field of fields || []) {
    if (field._type === 'pageBreak') {
      steps.push([])
      continue
    }
    steps[steps.length - 1].push(field)
  }
  // A trailing page break should not produce an empty final step.
  return steps.filter((step, i) => step.length > 0 || i === 0)
}

/** Labels for the progress indicator, one per step. */
export function stepLabels(fields: FormField[]): string[] {
  const labels: string[] = ['']
  for (const field of fields || []) {
    if (field._type === 'pageBreak') labels.push(String(field.stepLabel || ''))
  }
  return labels
}

/**
 * Where to go after finishing a step.
 *
 * Rules are checked in order and the first match wins. Steps are numbered from
 * 1 in the Studio because that is how an editor counts them; internally they
 * are indexed from 0.
 */
export function nextStepIndex(
  currentIndex: number,
  values: FormValues,
  routing: RoutingRule[] | undefined,
  totalSteps: number,
): number {
  for (const rule of routing || []) {
    if (!rule.afterStep || !rule.field || !rule.goToStep) continue
    if (rule.afterStep - 1 !== currentIndex) continue
    if (!matchesCondition(values[rule.field], rule.operator, rule.value)) continue
    const target = rule.goToStep - 1
    // A rule pointing outside the form, or backwards into a loop, is ignored
    // rather than trapping the visitor.
    if (target < 0 || target >= totalSteps || target <= currentIndex) continue
    return target
  }
  return Math.min(currentIndex + 1, totalSteps - 1)
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/
/** Ten digits, allowing the punctuation people actually type. */
const PHONE_DIGITS = /^\+?1?\d{10}$/

/**
 * Check one answer. Returns an error message written for the visitor, or null.
 *
 * Format checking only, and it runs everywhere. Checking that an address or
 * number actually exists is a separate, optional step handled by the
 * /api/validate routes, which do nothing unless a key has been saved.
 */
export function validateField(field: FormField, value: unknown): string | null {
  const label = field.label || 'This field'
  const empty = isEmptyValue(value)

  if (field.required && empty) {
    if (field._type === 'consentField') return 'Please tick this box to continue.'
    return `${label} is required.`
  }
  if (empty) return null

  switch (field._type) {
    case 'emailField':
      return EMAIL.test(String(value).trim()) ? null : 'Please check this email address.'
    case 'phoneField': {
      const digits = String(value).replace(/[^\d+]/g, '')
      return PHONE_DIGITS.test(digits) ? null : 'Please enter a 10 digit phone number.'
    }
    case 'numberField': {
      const n = Number(String(value).replace(/[^0-9.-]/g, ''))
      if (Number.isNaN(n)) return `${label} should be a number.`
      if (typeof field.min === 'number' && n < field.min) return `${label} cannot be less than ${field.min}.`
      if (typeof field.max === 'number' && n > field.max) return `${label} cannot be more than ${field.max}.`
      return null
    }
    case 'zipLookupField':
      return /^\d{5}(-\d{4})?$/.test(String(value).trim()) ? null : 'Please enter a 5 digit ZIP code.'
    default:
      return null
  }
}

/** Validate every visible input field in a set. Returns errors keyed by field name. */
export function validateFields(fields: FormField[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {}
  fields.forEach((field, i) => {
    if (!isInputField(field)) return
    if (!isVisible(field, values)) return
    const key = fieldName(field, i)
    const error = validateField(field, values[key])
    if (error) errors[key] = error
  })
  return errors
}

/**
 * Fill {{placeholders}} from a set of values.
 * An unknown placeholder becomes an empty string rather than being left
 * showing double braces to whoever receives the email.
 */
export function interpolate(template: string, values: Record<string, unknown>): string {
  return (template || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = values[key]
    return v === undefined || v === null ? '' : String(v)
  })
}
