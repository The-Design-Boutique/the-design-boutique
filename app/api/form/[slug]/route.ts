import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'
import {
  fieldName,
  interpolate,
  isInputField,
  isVisible,
  validateFields,
  type FormField,
  type FormValues,
} from '@/app/lib/formLogic'

/**
 * Receives a submission for any form built in Forms by Angelo.
 *
 * The form definition is read from Sanity rather than trusted from the browser,
 * so a submission cannot invent fields or skip a required one by editing the
 * page. Validation runs through the same module the browser uses, which matters
 * for conditional questions: a field hidden by a condition must be treated as
 * hidden here too, or somebody gets rejected for not answering a question they
 * were never shown.
 *
 * Saving the submission is the part that must not fail. Notifications and
 * webhooks are attempted afterwards and their failures are reported without
 * losing the enquiry, because an email that does not arrive is recoverable and
 * a lost enquiry is not.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

const FORM_QUERY = `*[_type == "form" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, fields, settings, notifications, stepRouting
}`

interface FormDoc {
  _id: string
  title?: string
  slug?: string
  fields?: FormField[]
  settings?: { successAction?: string; successMessage?: string; redirectUrl?: string }
  notifications?: {
    recipients?: string[]
    subjectTemplate?: string
    webhooks?: Array<{
      url?: string
      method?: string
      fieldMappings?: Array<{ formField?: string; mappedKey?: string }>
      sendRawPayload?: boolean
    }>
  }
}

/** Answers rendered for a human: a label, and the answer as a sentence. */
function readableAnswers(fields: FormField[], values: FormValues) {
  const out: Array<{ label: string; name: string; value: string }> = []
  fields.forEach((field, i) => {
    if (!isInputField(field)) return
    if (!isVisible(field, values)) return
    const name = fieldName(field, i)
    const raw = values[name]
    if (raw === undefined || raw === null || raw === '') return
    const value = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'boolean'
        ? raw
          ? 'Yes'
          : 'No'
        : typeof raw === 'object'
          ? Object.values(raw as Record<string, unknown>).filter(Boolean).join(', ')
          : String(raw)
    out.push({ label: field.label || name, name, value })
  })
  return out
}

async function sendNotification(form: FormDoc, answers: Array<{ label: string; value: string }>, values: FormValues) {
  const recipients = (form.notifications?.recipients || []).filter(Boolean)
  if (!recipients.length) return { sent: false, reason: 'no recipients configured' }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.FORM_FROM_EMAIL
  if (!apiKey || !from) return { sent: false, reason: 'email is not configured on the server' }

  const subject = interpolate(
    form.notifications?.subjectTemplate || 'New {{formTitle}} submission',
    { ...values, formTitle: form.title || 'form' },
  )

  const rows = answers
    .map((a) => `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">${a.label}</td><td style="padding:6px 0">${a.value}</td></tr>`)
    .join('')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html: `<p>A new submission from <strong>${form.title || 'a form'}</strong>.</p><table>${rows}</table>`,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok ? { sent: true } : { sent: false, reason: `email provider returned ${res.status}` }
  } catch {
    return { sent: false, reason: 'could not reach the email provider' }
  }
}

async function fireWebhooks(form: FormDoc, values: FormValues) {
  const hooks = form.notifications?.webhooks || []
  await Promise.allSettled(
    hooks
      .filter((h) => h.url)
      .map((hook) => {
        const mapped: Record<string, unknown> = hook.sendRawPayload === false ? {} : { ...values }
        for (const m of hook.fieldMappings || []) {
          if (m.formField && m.mappedKey) mapped[m.mappedKey] = values[m.formField]
        }
        return fetch(hook.url!, {
          method: hook.method === 'PUT' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: form.slug, submittedAt: new Date().toISOString(), ...mapped }),
          signal: AbortSignal.timeout(10_000),
        })
      }),
  )
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let payload: { values?: FormValues; pageUrl?: string; meta?: Record<string, string> }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected a JSON body.' }, { status: 400 })
  }

  const values: FormValues = payload.values || {}
  const form = await client.fetch<FormDoc | null>(FORM_QUERY, { slug })
  if (!form) return NextResponse.json({ ok: false, error: 'That form no longer exists.' }, { status: 404 })

  const fields = (form.fields || []).filter((f) => f._type !== 'pageBreak')

  // Validate against the stored definition, never against what was submitted.
  const errors = validateFields(fields, values)
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors, error: 'Please check the highlighted fields.' }, { status: 400 })
  }

  const answers = readableAnswers(fields, values)
  const meta = payload.meta || {}

  // Fill the legacy columns when the form has an equivalent question, so the
  // submissions list stays readable at a glance.
  const find = (needle: RegExp) => answers.find((a) => needle.test(a.name) || needle.test(a.label))?.value

  try {
    await client.create({
      _type: 'formSubmission',
      formTitle: form.title,
      formSlug: form.slug,
      name: find(/^(name|full_?name|first_?name)$/i) || find(/name/i),
      email: find(/e-?mail/i),
      message: find(/message|comment|enquiry|inquiry|details/i),
      answers: answers.map((a) => ({ _type: 'answer', ...a })),
      pageUrl: payload.pageUrl?.slice(0, 300),
      utmSource: meta.utm_source,
      utmMedium: meta.utm_medium,
      utmCampaign: meta.utm_campaign,
      referrer: meta.referrer?.slice(0, 300),
      submittedAt: new Date().toISOString(),
    })
  } catch {
    // The one failure the visitor must hear about.
    return NextResponse.json(
      { ok: false, error: 'We could not save your message just now. Please try again in a moment.' },
      { status: 500 },
    )
  }

  const notified = await sendNotification(form, answers, values)
  await fireWebhooks(form, values)

  return NextResponse.json({
    ok: true,
    successAction: form.settings?.successAction || 'message',
    successMessage: form.settings?.successMessage,
    redirectUrl: form.settings?.redirectUrl,
    // Surfaced for the Studio and logs, never shown to the visitor: their
    // message was saved either way.
    notified,
  })
}
