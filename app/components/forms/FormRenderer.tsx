'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PortableText } from '@portabletext/react'
import {
  fieldName,
  isInputField,
  isVisible,
  nextStepIndex,
  splitIntoSteps,
  stepLabels,
  validateFields,
  type FormField,
  type FormValues,
  type RoutingRule,
} from '@/app/lib/formLogic'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Renders a form built in Forms by Angelo.
 *
 * The rules live in `app/lib/formLogic.ts` and are shared with the server, so
 * what the visitor sees and what the server accepts cannot drift apart. This
 * file is presentation and interaction only.
 *
 * Styling reuses the site's own form classes rather than importing a component
 * library, because the whole point of this build is matching the existing
 * design.
 */

export interface FormDoc {
  _id?: string
  title?: string
  slug?: string
  fields?: FormField[]
  settings?: {
    stepMode?: string
    showProgressBar?: boolean
    progressStyle?: string
    submitButtonText?: string
    nextButtonText?: string
    backButtonText?: string
    successAction?: string
    successMessage?: string
    redirectUrl?: string
  }
  stepRouting?: RoutingRule[]
}

const widthClass = (w?: string) => (w === 'half' ? 'fba-w-half' : w === 'third' ? 'fba-w-third' : 'fba-w-full')

/** Campaign parameters, read once so hidden fields can record where a lead came from. */
function readMeta(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const meta: Record<string, string> = {}
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = params.get(k)
    if (v) meta[k] = v
  }
  if (document.referrer) meta.referrer = document.referrer
  meta.pageUrl = window.location.href
  return meta
}

export function FormRenderer({ form }: { form: FormDoc }) {
  const settings = form.settings || {}
  const allFields = useMemo(() => form.fields || [], [form.fields])
  const steps = useMemo(() => splitIntoSteps(allFields), [allFields])
  const labels = useMemo(() => stepLabels(allFields), [allFields])

  const [values, setValues] = useState<FormValues>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)
  const meta = useRef<Record<string, string>>({})
  const headingRef = useRef<HTMLDivElement>(null)

  // Seed hidden fields from the URL, so campaign data is captured without the
  // visitor doing anything.
  useEffect(() => {
    meta.current = readMeta()
    const seeded: FormValues = {}
    for (const field of allFields) {
      if (field._type !== 'hiddenField') continue
      const key = String(field.name || '')
      if (!key) continue
      const template = String(field.defaultValue || '')
      seeded[key] = template.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_m, token: string) => meta.current[token] || '')
    }
    if (Object.keys(seeded).length) setValues((v) => ({ ...seeded, ...v }))
  }, [allFields])

  const setValue = useCallback((key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
  }, [])

  const visibleIn = useCallback(
    (fields: FormField[]) => fields.filter((f) => isVisible(f, values)),
    [values],
  )

  /** Ask the server whether an address or number is real. Advisory only. */
  const verify = useCallback(async (kind: 'email' | 'phone', key: string, value: string) => {
    if (!value) return
    try {
      const res = await fetch(`/api/validate/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [kind]: value }),
      })
      const data = await res.json()
      if (data?.configured && data?.valid === false && data?.message) {
        setErrors((e) => ({ ...e, [key]: data.message }))
      }
    } catch {
      // Verification is a nicety; never let it block the visitor.
    }
  }, [])

  /** ZIP lookup, using a free service, filling city and state alongside. */
  const lookupZip = useCallback(
    async (field: FormField, zip: string) => {
      if (!/^\d{5}$/.test(zip)) return
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
        if (!res.ok) return
        const data = await res.json()
        const place = data?.places?.[0]
        if (!place) return
        setValues((v) => ({
          ...v,
          [String(field.cityFieldName || 'city')]: place['place name'],
          [String(field.stateFieldName || 'state')]: place['state abbreviation'],
        }))
      } catch {
        // A failed lookup just means they type the city themselves.
      }
    },
    [],
  )

  const goToStep = useCallback((index: number) => {
    setStepIndex(index)
    // Move focus to the top of the form so a screen reader announces the new
    // step rather than leaving the user where the button used to be.
    requestAnimationFrame(() => headingRef.current?.focus())
  }, [])

  const advance = useCallback(() => {
    const current = visibleIn(steps[stepIndex] || [])
    const stepErrors = validateFields(current, values)
    if (Object.keys(stepErrors).length) {
      setErrors((e) => ({ ...e, ...stepErrors }))
      return
    }
    setHistory((h) => [...h, stepIndex])
    goToStep(nextStepIndex(stepIndex, values, form.stepRouting, steps.length))
  }, [steps, stepIndex, values, visibleIn, form.stepRouting, goToStep])

  const back = useCallback(() => {
    setHistory((h) => {
      const previous = h[h.length - 1]
      // Follow the path actually taken, which conditional routing can make
      // different from simply one step back.
      goToStep(previous === undefined ? Math.max(0, stepIndex - 1) : previous)
      return h.slice(0, -1)
    })
  }, [stepIndex, goToStep])

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      const everything = visibleIn(allFields.filter((f) => f._type !== 'pageBreak'))
      const allErrors = validateFields(everything, values)
      if (Object.keys(allErrors).length) {
        setErrors(allErrors)
        setFormError('Please check the highlighted questions.')
        return
      }

      setStatus('sending')
      setFormError(null)
      try {
        const res = await fetch(`/api/form/${form.slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values, pageUrl: meta.current.pageUrl, meta: meta.current }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (data?.errors) setErrors(data.errors)
          setFormError(data?.error || 'Something went wrong. Please try again.')
          setStatus('error')
          return
        }
        if (data.successAction === 'redirect' && data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }
        setDoneMessage(data.successMessage || settings.successMessage || 'Thank you. We have received your message.')
        setStatus('done')
      } catch {
        setFormError('We could not reach the server. Please try again in a moment.')
        setStatus('error')
      }
    },
    [allFields, values, visibleIn, form.slug, settings.successMessage],
  )

  if (status === 'done') {
    return (
      <div className="fba-success" role="status">
        <p>{doneMessage}</p>
      </div>
    )
  }

  const multiStep = steps.length > 1
  const currentFields = visibleIn(steps[stepIndex] || [])
  const isLastStep = stepIndex === steps.length - 1

  return (
    <form className="contact-form fba-form" onSubmit={submit} noValidate>
      {multiStep && settings.showProgressBar !== false ? (
        <Progress
          style={settings.progressStyle || 'steps'}
          index={stepIndex}
          total={steps.length}
          labels={labels}
        />
      ) : null}

      <div ref={headingRef} tabIndex={-1} className="fba-step" aria-live="polite">
        <div className="fba-grid">
          {currentFields.map((field, i) => (
            <Field
              key={field._key || `${field._type}-${i}`}
              field={field}
              name={fieldName(field, i)}
              value={values[fieldName(field, i)]}
              error={errors[fieldName(field, i)]}
              onChange={setValue}
              onVerify={verify}
              onZip={lookupZip}
              onAutoAdvance={settings.stepMode === 'auto' && multiStep ? advance : undefined}
            />
          ))}
        </div>
      </div>

      {formError ? (
        <p className="fba-form-error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="fba-actions">
        {multiStep && stepIndex > 0 ? (
          <button type="button" className="btn btn--ghost" onClick={back} disabled={status === 'sending'}>
            {settings.backButtonText || 'Back'}
          </button>
        ) : null}

        {multiStep && !isLastStep ? (
          <button type="button" className="btn btn--send" onClick={advance}>
            {settings.nextButtonText || 'Next'}
          </button>
        ) : (
          <button type="submit" className="btn btn--send" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending' : settings.submitButtonText || 'Send'}
          </button>
        )}
      </div>
    </form>
  )
}

function Progress({
  style,
  index,
  total,
  labels,
}: {
  style: string
  index: number
  total: number
  labels: string[]
}) {
  if (style === 'fraction') {
    return (
      <p className="fba-progress-fraction">
        Step {index + 1} of {total}
      </p>
    )
  }
  if (style === 'bar') {
    const pct = Math.round(((index + 1) / total) * 100)
    return (
      <div
        className="fba-progress-bar"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
aria-label="Progress through the form"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    )
  }
  return (
    <ol className="fba-progress-steps">
      {Array.from({ length: total }, (_, i) => (
        <li key={i} className={i === index ? 'is-current' : i < index ? 'is-done' : ''}>
          <span className="fba-step-number">{i + 1}</span>
          {labels[i] ? <span className="fba-step-label">{labels[i]}</span> : null}
        </li>
      ))}
    </ol>
  )
}

interface FieldProps {
  field: FormField
  name: string
  value: unknown
  error?: string
  onChange: (key: string, value: unknown) => void
  onVerify: (kind: 'email' | 'phone', key: string, value: string) => void
  onZip: (field: FormField, zip: string) => void
  onAutoAdvance?: () => void
}

function Field(props: FieldProps) {
  const { field, name, value, error, onChange, onVerify, onZip, onAutoAdvance } = props
  const id = `f-${name}`
  const describedBy = [error ? `${id}-error` : null, field.helpText ? `${id}-help` : null]
    .filter(Boolean)
    .join(' ')

  const label = !field.hideLabel && field.label ? (
    <label htmlFor={id} className="fba-label">
      {field.label}
      {field.required ? <span aria-hidden="true"> *</span> : null}
    </label>
  ) : field.label ? (
    <label htmlFor={id} className="fba-visually-hidden">
      {field.label}
    </label>
  ) : null

  const wrap = (control: React.ReactNode) => (
    <div className={`fba-field ${widthClass(field.width as string)}${error ? ' has-error' : ''}`}>
      {label}
      {control}
      {field.helpText ? (
        <p className="fba-help" id={`${id}-help`}>
          {field.helpText}
        </p>
      ) : null}
      {error ? (
        <p className="fba-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )

  const common = {
    id,
    name,
    required: Boolean(field.required),
    placeholder: (field.placeholder as string) || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  }

  switch (field._type) {
    case 'sectionHeading':
      return (
        <div className={`fba-field ${widthClass(field.width as string)}`}>
          {field.heading ? <h3 className="fba-section-heading">{String(field.heading)}</h3> : null}
          {field.description ? <p className="fba-section-description">{String(field.description)}</p> : null}
        </div>
      )

    case 'htmlField':
      return (
        <div className={`fba-field fba-copy ${widthClass(field.width as string)}`}>
          {Array.isArray(field.content) ? <PortableText value={field.content as any} /> : null}
        </div>
      )

    case 'hiddenField':
      return null

    case 'textareaField':
      return wrap(
        <textarea
          {...common}
          rows={Number(field.rows) || 4}
          value={String(value ?? '')}
          onChange={(e) => onChange(name, e.target.value)}
        />,
      )

    case 'selectField':
      return wrap(
        <select
          {...common}
          value={String(value ?? '')}
          onChange={(e) => {
            onChange(name, e.target.value)
            if (field.autoAdvance && onAutoAdvance) onAutoAdvance()
          }}
        >
          <option value="">{(field.placeholder as string) || 'Please choose'}</option>
          {(field.options || []).map((o, i) => (
            <option key={i} value={o.value || o.label}>
              {o.label}
            </option>
          ))}
        </select>,
      )

    case 'radioField':
      return wrap(
        <div className="fba-choices" role="radiogroup" aria-labelledby={id}>
          {(field.options || []).map((o, i) => {
            const v = o.value || o.label || ''
            return (
              <label key={i} className="fba-choice">
                <input
                  type="radio"
                  name={name}
                  value={v}
                  checked={String(value ?? '') === v}
                  onChange={() => {
                    onChange(name, v)
                    if (field.autoAdvance && onAutoAdvance) onAutoAdvance()
                  }}
                />
                <span>{o.label}</span>
              </label>
            )
          })}
        </div>,
      )

    case 'checkboxField':
    case 'multiSelectField': {
      const selected = Array.isArray(value) ? (value as string[]) : []
      const options = field.options || []
      const toggle = (v: string) =>
        onChange(name, selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
      return wrap(
        <div className="fba-choices">
          {field.enableSelectAll ? (
            <label className="fba-choice fba-choice--all">
              <input
                type="checkbox"
                checked={selected.length === options.length && options.length > 0}
                onChange={(e) =>
                  onChange(name, e.target.checked ? options.map((o) => o.value || o.label || '') : [])
                }
              />
              <span>Select all</span>
            </label>
          ) : null}
          {options.map((o, i) => {
            const v = o.value || o.label || ''
            return (
              <label key={i} className="fba-choice">
                <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)} />
                <span>{o.label}</span>
              </label>
            )
          })}
        </div>,
      )
    }

    case 'consentField':
      return (
        <div className={`fba-field ${widthClass(field.width as string)}${error ? ' has-error' : ''}`}>
          <label className="fba-choice fba-consent">
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              aria-describedby={describedBy || undefined}
              onChange={(e) => onChange(name, e.target.checked)}
            />
            <span>
              {Array.isArray(field.consentText) && field.consentText.length ? (
                <PortableText value={field.consentText as any} />
              ) : (
                field.label || 'I agree'
              )}
            </span>
          </label>
          {error ? (
            <p className="fba-error" id={`${id}-error`} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )

    case 'nameField': {
      const parts = (value as Record<string, string>) || {}
      const set = (k: string, v: string) => onChange(name, { ...parts, [k]: v })
      return wrap(
        <div className="fba-subfields">
          <input placeholder="First name" value={parts.first || ''} onChange={(e) => set('first', e.target.value)} />
          {field.showMiddleName ? (
            <input placeholder="Middle name" value={parts.middle || ''} onChange={(e) => set('middle', e.target.value)} />
          ) : null}
          <input placeholder="Last name" value={parts.last || ''} onChange={(e) => set('last', e.target.value)} />
        </div>,
      )
    }

    case 'addressField': {
      const parts = (value as Record<string, string>) || {}
      const set = (k: string, v: string) => onChange(name, { ...parts, [k]: v })
      return wrap(
        <div className="fba-subfields fba-subfields--stack">
          <input placeholder="Street address" value={parts.line1 || ''} onChange={(e) => set('line1', e.target.value)} />
          {field.showLine2 !== false ? (
            <input placeholder="Apartment, suite, etc." value={parts.line2 || ''} onChange={(e) => set('line2', e.target.value)} />
          ) : null}
          <div className="fba-subfields">
            <input placeholder="City" value={parts.city || ''} onChange={(e) => set('city', e.target.value)} />
            <input placeholder="State" value={parts.state || ''} onChange={(e) => set('state', e.target.value)} />
            <input placeholder="ZIP" value={parts.zip || ''} onChange={(e) => set('zip', e.target.value)} />
          </div>
        </div>,
      )
    }

    case 'zipLookupField':
      return wrap(
        <input
          {...common}
          inputMode="numeric"
          maxLength={10}
          value={String(value ?? '')}
          onChange={(e) => {
            onChange(name, e.target.value)
            if (/^\d{5}$/.test(e.target.value)) onZip(field, e.target.value)
          }}
        />,
      )

    case 'emailField':
      return wrap(
        <input
          {...common}
          type="email"
          autoComplete="email"
          value={String(value ?? '')}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={(e) => {
            if (field.validateTrigger === 'blur') onVerify('email', name, e.target.value)
          }}
        />,
      )

    case 'phoneField':
      return wrap(
        <input
          {...common}
          type="tel"
          autoComplete="tel"
          value={String(value ?? '')}
          onChange={(e) => {
            onChange(name, e.target.value)
            const digits = e.target.value.replace(/\D/g, '')
            if (field.validateTrigger === 'complete' && digits.length === 10) {
              onVerify('phone', name, e.target.value)
            }
          }}
          onBlur={(e) => {
            if (field.validateTrigger === 'blur') onVerify('phone', name, e.target.value)
          }}
        />,
      )

    case 'numberField':
      return wrap(
        <input
          {...common}
          inputMode="decimal"
          value={String(value ?? '')}
          onChange={(e) => onChange(name, e.target.value)}
        />,
      )

    case 'dateField':
      return wrap(
        <input {...common} type="date" value={String(value ?? '')} onChange={(e) => onChange(name, e.target.value)} />,
      )

    default:
      if (!isInputField(field)) return null
      return wrap(
        <input {...common} type="text" value={String(value ?? '')} onChange={(e) => onChange(name, e.target.value)} />,
      )
  }
}
