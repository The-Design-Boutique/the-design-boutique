import { defineField, defineType } from 'sanity'

import { NotificationsInput } from '../../components/NotificationsInput'

/**
 * Forms by Angelo: build a form once, embed it on any page.
 *
 * Ported from the mortgage boilerplate. Three deliberate differences, each
 * because a straight copy would have been wrong for this project:
 *
 *   No API key field on the form. The boilerplate stores a Resend key on each
 *   form document. Documents in this dataset are readable outside the Studio,
 *   so a key here would be a published key, and it would also have to be
 *   repeated on every form. One encrypted key lives in Site Settings under
 *   Forms instead, and the Notifications tab below says so plainly when it is
 *   missing rather than silently sending nothing.
 *
 *   Live email and phone verification is optional rather than assumed. Both use
 *   paid services, so each field can ask for it but nothing happens unless a key
 *   has been saved in Site Settings. Without one, the field still checks that
 *   what was typed looks right, which catches most typos.
 *
 *   Postcode lookup is kept, because the service behind it is free.
 */

const operatorOptions = [
  { title: 'Equals', value: 'equals' },
  { title: 'Does not equal', value: 'not_equals' },
  { title: 'Contains', value: 'contains' },
  { title: 'Is empty', value: 'is_empty' },
  { title: 'Is not empty', value: 'is_not_empty' },
]

const widthOptions = [
  { title: 'Full width', value: 'full' },
  { title: 'Half width', value: 'half' },
  { title: 'One third', value: 'third' },
]

/** Show this field only when another field's answer matches. */
const visibilityFields = [
  defineField({
    name: 'conditionalField',
    title: 'Only show when this field',
    type: 'string',
    description: 'The Field Name of the question this one depends on. Leave empty to always show.',
  }),
  defineField({ name: 'conditionalOperator', title: 'Is', type: 'string', options: { list: operatorOptions } }),
  defineField({ name: 'conditionalValue', title: 'This value', type: 'string' }),
]

const commonFields = [
  defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
  defineField({
    name: 'name',
    title: 'Field name',
    type: 'string',
    description: 'Used to identify this answer in submissions and notification emails. Generated from the label if left empty.',
  }),
  defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: false }),
  defineField({
    name: 'hideLabel',
    title: 'Hide the label',
    type: 'boolean',
    initialValue: false,
    description: 'Hides it visually. Screen readers still announce it, so accessibility is unaffected.',
  }),
  defineField({ name: 'placeholder', title: 'Placeholder', type: 'string' }),
  defineField({ name: 'width', title: 'Width', type: 'string', options: { list: widthOptions }, initialValue: 'full' }),
  defineField({ name: 'helpText', title: 'Help text', type: 'string', description: 'Small text shown under the field.' }),
  defineField({
    name: 'autoAdvance',
    title: 'Move to the next step when answered',
    type: 'boolean',
    initialValue: false,
    description: 'Only applies to multi-step forms.',
  }),
  ...visibilityFields,
]

const optionsField = defineField({
  name: 'options',
  title: 'Options',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
        defineField({
          name: 'value',
          title: 'Value',
          type: 'string',
          description: 'What gets recorded when this option is chosen. Uses the label if left empty.',
        }),
      ],
      preview: { select: { title: 'label', subtitle: 'value' } },
    },
  ],
  validation: (rule) => rule.min(1).warning('A choice field needs at least one option.'),
})

const previewFor = (fallback: string, subtitle: string) => ({
  select: { title: 'label' },
  prepare: ({ title }: { title?: string }) => ({ title: title || fallback, subtitle }),
})

export const form = defineType({
  name: 'form',
  title: 'Forms by Angelo',
  type: 'document',
  groups: [
    { name: 'fields', title: 'Questions', default: true },
    { name: 'settings', title: 'Settings' },
    { name: 'notifications', title: 'Notifications' },
    { name: 'routing', title: 'Step routing' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Form name', type: 'string', validation: (rule) => rule.required(), group: 'fields' }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
      group: 'fields',
      description: 'Identifies this form when it is submitted. Changing it on a live form stops submissions until the page is republished.',
    }),

    defineField({
      name: 'fields',
      title: 'Questions',
      type: 'array',
      group: 'fields',
      description: 'Add questions in the order they should appear. Use a Page break to split a long form into steps.',
      of: [
        { type: 'object', name: 'textField', title: 'Text', fields: [...commonFields], preview: previewFor('Text', 'Text') },
        {
          type: 'object',
          name: 'emailField',
          title: 'Email',
          fields: [
            ...commonFields,
            defineField({
              name: 'validateTrigger',
              title: 'Check the address is real',
              type: 'string',
              description:
                'Needs a MailVerify key in Site Settings. Without one this does nothing and the field simply checks the address looks correct.',
              options: {
                list: [
                  { title: 'When they move to the next field', value: 'blur' },
                  { title: 'When they submit', value: 'submit' },
                  { title: 'Do not check', value: 'none' },
                ],
              },
              initialValue: 'none',
            }),
          ],
          preview: previewFor('Email', 'Email'),
        },
        {
          type: 'object',
          name: 'phoneField',
          title: 'Phone',
          fields: [
            ...commonFields,
            defineField({
              name: 'validateTrigger',
              title: 'Check the number is real',
              type: 'string',
              description:
                'Needs a NumVerify key in Site Settings. Without one this does nothing and the field simply checks the number looks correct.',
              options: {
                list: [
                  { title: 'Once a full number is typed', value: 'complete' },
                  { title: 'When they move to the next field', value: 'blur' },
                  { title: 'When they submit', value: 'submit' },
                  { title: 'Do not check', value: 'none' },
                ],
              },
              initialValue: 'none',
            }),
          ],
          preview: previewFor('Phone', 'Phone'),
        },
        {
          type: 'object',
          name: 'numberField',
          title: 'Number',
          fields: [
            ...commonFields,
            defineField({ name: 'min', title: 'Minimum', type: 'number' }),
            defineField({ name: 'max', title: 'Maximum', type: 'number' }),
            defineField({
              name: 'numberFormat',
              title: 'Format',
              type: 'string',
              options: {
                list: [
                  { title: 'Plain number', value: 'plain' },
                  { title: 'Currency', value: 'currency' },
                  { title: 'Percentage', value: 'percentage' },
                ],
              },
              initialValue: 'plain',
            }),
          ],
          preview: previewFor('Number', 'Number'),
        },
        {
          type: 'object',
          name: 'textareaField',
          title: 'Long text',
          fields: [...commonFields, defineField({ name: 'rows', title: 'Rows', type: 'number', initialValue: 4 })],
          preview: previewFor('Long text', 'Long text'),
        },
        { type: 'object', name: 'selectField', title: 'Dropdown', fields: [...commonFields, optionsField], preview: previewFor('Dropdown', 'Dropdown') },
        { type: 'object', name: 'multiSelectField', title: 'Multi-select', fields: [...commonFields, optionsField], preview: previewFor('Multi-select', 'Multi-select') },
        { type: 'object', name: 'radioField', title: 'Radio buttons', fields: [...commonFields, optionsField], preview: previewFor('Radio buttons', 'Choose one') },
        {
          type: 'object',
          name: 'checkboxField',
          title: 'Checkboxes',
          fields: [
            ...commonFields,
            optionsField,
            defineField({ name: 'enableSelectAll', title: 'Add a "select all" toggle', type: 'boolean', initialValue: false }),
          ],
          preview: previewFor('Checkboxes', 'Choose any'),
        },
        { type: 'object', name: 'dateField', title: 'Date', fields: [...commonFields], preview: previewFor('Date', 'Date') },
        {
          type: 'object',
          name: 'nameField',
          title: 'Name',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', initialValue: 'Name' }),
            defineField({ name: 'name', title: 'Field name', type: 'string' }),
            defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: false }),
            defineField({ name: 'showMiddleName', title: 'Include a middle name', type: 'boolean', initialValue: false }),
            defineField({ name: 'width', title: 'Width', type: 'string', options: { list: widthOptions }, initialValue: 'full' }),
            ...visibilityFields,
          ],
          preview: { prepare: () => ({ title: 'Name', subtitle: 'First and last name' }) },
        },
        {
          type: 'object',
          name: 'addressField',
          title: 'Address',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', initialValue: 'Address' }),
            defineField({ name: 'name', title: 'Field name', type: 'string' }),
            defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: false }),
            defineField({ name: 'showLine2', title: 'Include a second address line', type: 'boolean', initialValue: true }),
            defineField({ name: 'width', title: 'Width', type: 'string', options: { list: widthOptions }, initialValue: 'full' }),
            ...visibilityFields,
          ],
          preview: { prepare: () => ({ title: 'Address', subtitle: 'Street, city, state, ZIP' }) },
        },
        {
          type: 'object',
          name: 'zipLookupField',
          title: 'ZIP code',
          description: 'Looks up the city and state automatically once a valid ZIP is entered.',
          fields: [
            ...commonFields,
            defineField({ name: 'cityFieldName', title: 'City recorded as', type: 'string', initialValue: 'city' }),
            defineField({ name: 'stateFieldName', title: 'State recorded as', type: 'string', initialValue: 'state' }),
          ],
          preview: previewFor('ZIP code', 'ZIP, with city and state lookup'),
        },
        {
          type: 'object',
          name: 'consentField',
          title: 'Consent',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', initialValue: 'I agree' }),
            defineField({ name: 'name', title: 'Field name', type: 'string' }),
            defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: true }),
            defineField({
              name: 'consentText',
              title: 'Consent wording',
              type: 'array',
              of: [{ type: 'block' }],
              description: 'The wording shown beside the tick box. Links are allowed.',
            }),
            defineField({ name: 'width', title: 'Width', type: 'string', options: { list: widthOptions }, initialValue: 'full' }),
            ...visibilityFields,
          ],
          preview: { prepare: () => ({ title: 'Consent', subtitle: 'Agreement tick box' }) },
        },
        {
          type: 'object',
          name: 'htmlField',
          title: 'Text block',
          description: 'Explanatory copy inside the form. Not a question.',
          fields: [
            defineField({ name: 'content', title: 'Content', type: 'array', of: [{ type: 'block' }] }),
            defineField({ name: 'width', title: 'Width', type: 'string', options: { list: widthOptions }, initialValue: 'full' }),
            ...visibilityFields,
          ],
          preview: { prepare: () => ({ title: 'Text block', subtitle: 'Display only' }) },
        },
        {
          type: 'object',
          name: 'sectionHeading',
          title: 'Section heading',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'string' }),
            defineField({ name: 'width', title: 'Width', type: 'string', options: { list: widthOptions }, initialValue: 'full' }),
            ...visibilityFields,
          ],
          preview: {
            select: { title: 'heading' },
            prepare: ({ title }) => ({ title: title || 'Section', subtitle: 'Section heading' }),
          },
        },
        {
          type: 'object',
          name: 'pageBreak',
          title: 'Page break',
          description: 'Everything after this appears on the next step.',
          fields: [defineField({ name: 'stepLabel', title: 'Step label', type: 'string', description: 'Shown in the progress indicator.' })],
          preview: {
            select: { title: 'stepLabel' },
            prepare: ({ title }) => ({ title: title || 'Page break', subtitle: 'Starts a new step' }),
          },
        },
        {
          type: 'object',
          name: 'hiddenField',
          title: 'Hidden field',
          description: 'Recorded with the submission but never shown to the visitor.',
          fields: [
            defineField({ name: 'name', title: 'Field name', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'defaultValue',
              title: 'Value',
              type: 'string',
              description: 'Supports {{utm_source}}, {{utm_medium}}, {{utm_campaign}}, {{utm_term}}, {{utm_content}}, {{referrer}} and {{pageUrl}}.',
            }),
          ],
          preview: {
            select: { title: 'name' },
            prepare: ({ title }) => ({ title: title || 'Hidden field', subtitle: 'Hidden' }),
          },
        },
      ],
    }),

    defineField({
      name: 'settings',
      title: 'Settings',
      type: 'object',
      group: 'settings',
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'stepMode',
          title: 'How steps advance',
          type: 'string',
          options: {
            list: [
              { title: 'The visitor presses Next', value: 'manual' },
              { title: 'Advance automatically once answered', value: 'auto' },
            ],
          },
          initialValue: 'manual',
        }),
        defineField({ name: 'showProgressBar', title: 'Show a progress indicator', type: 'boolean', initialValue: true }),
        defineField({
          name: 'progressStyle',
          title: 'Progress style',
          type: 'string',
          options: {
            list: [
              { title: 'Numbered steps', value: 'steps' },
              { title: 'Progress bar', value: 'bar' },
              { title: 'Step 2 of 4', value: 'fraction' },
            ],
          },
          initialValue: 'steps',
        }),
        defineField({ name: 'submitButtonText', title: 'Submit button', type: 'string', initialValue: 'Send' }),
        defineField({ name: 'nextButtonText', title: 'Next button', type: 'string', initialValue: 'Next' }),
        defineField({ name: 'backButtonText', title: 'Back button', type: 'string', initialValue: 'Back' }),
        defineField({
          name: 'successAction',
          title: 'After submitting',
          type: 'string',
          options: {
            list: [
              { title: 'Show a thank you message', value: 'message' },
              { title: 'Send them to another page', value: 'redirect' },
            ],
          },
          initialValue: 'message',
        }),
        defineField({
          name: 'successMessage',
          title: 'Thank you message',
          type: 'text',
          rows: 2,
          initialValue: 'Thank you. We have received your message and will be in touch shortly.',
          hidden: ({ parent }) => parent?.successAction === 'redirect',
        }),
        defineField({
          name: 'redirectUrl',
          title: 'Send them to',
          type: 'string',
          description: 'A path on this site such as /contact/thank-you.',
          hidden: ({ parent }) => parent?.successAction !== 'redirect',
        }),
      ],
    }),

    defineField({
      name: 'notifications',
      title: 'Notifications',
      type: 'object',
      group: 'notifications',
      options: { collapsible: false },
      // Warns when no Resend key is saved, because an unsent notification looks
      // exactly like a form nobody has filled in.
      components: { input: NotificationsInput },
      description:
        'Every submission is saved in the Studio under Form Submissions whether or not anybody is emailed. These settings only control who gets told about it. Sending email requires a Resend key in Site Settings under Forms.',
      fields: [
        defineField({
          name: 'recipients',
          title: 'Email these people',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'One address per line. Leave empty to save submissions without emailing anyone.',
        }),
        defineField({
          name: 'subjectTemplate',
          title: 'Subject line',
          type: 'string',
          initialValue: 'New {{formTitle}} submission',
          description: 'Use {{formTitle}} for the form name, or {{fieldName}} to include an answer.',
        }),
        defineField({
          name: 'webhooks',
          title: 'Send to another system',
          type: 'array',
          description:
            'Optional, and most sites never need it. As well as emailing people, every submission can be handed straight to another piece of software the moment it arrives: a CRM such as HubSpot or Salesforce, or an automation tool such as Zapier or Make. That other system gives you a web address to send to; you paste it in below. Nothing happens here unless you add one, and adding one does not stop the emails.',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'url',
                  title: 'Web address to send to',
                  type: 'url',
                  description:
                    'Provided by the system receiving the submissions. In Zapier this is the "Catch Hook" URL you are shown when you set up a Webhooks trigger. Treat it as private: anyone with it can send data into your CRM.',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: 'label',
                  title: 'What is this?',
                  type: 'string',
                  description: 'For your own reference, such as "HubSpot" or "Zapier: add to mailing list". Nobody outside sees it.',
                }),
                defineField({
                  name: 'method',
                  title: 'Method',
                  type: 'string',
                  options: { list: ['POST', 'PUT'] },
                  initialValue: 'POST',
                  description: 'Leave this as POST unless the receiving system has specifically asked for PUT. Almost all of them want POST.',
                }),
                defineField({
                  name: 'fieldMappings',
                  title: 'Rename fields for this system',
                  type: 'array',
                  description:
                    'Only needed when the other system insists on its own names. If your form asks for "Your email" but the CRM expects that to arrive as "email_address", set that here. Leave empty and the fields keep the names they have on the form.',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        defineField({ name: 'formField', title: 'Our field name', type: 'string' }),
                        defineField({ name: 'mappedKey', title: 'Their field name', type: 'string' }),
                      ],
                      preview: {
                        select: { title: 'formField', subtitle: 'mappedKey' },
                        prepare: ({ title, subtitle }) => ({ title: `${title} becomes ${subtitle}` }),
                      },
                    },
                  ],
                }),
                defineField({
                  name: 'sendRawPayload',
                  title: 'Send every field',
                  type: 'boolean',
                  initialValue: true,
                  description:
                    'On by default, which sends the whole submission and is what you usually want. Turn it off to send only the fields you renamed above, which is worth doing when the form collects something the other system has no business storing.',
                }),
              ],
              preview: { select: { title: 'label', subtitle: 'url' } },
            },
          ],
        }),
      ],
    }),

    defineField({
      name: 'stepRouting',
      title: 'Step routing',
      type: 'array',
      group: 'routing',
      description:
        'Optional. Send people to a different step depending on their answer. Without any rules, steps run in order.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'afterStep', title: 'After step number', type: 'number', validation: (rule) => rule.required().min(1) }),
            defineField({ name: 'field', title: 'When field', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'operator', title: 'Is', type: 'string', options: { list: operatorOptions }, validation: (rule) => rule.required() }),
            defineField({ name: 'value', title: 'This value', type: 'string' }),
            defineField({ name: 'goToStep', title: 'Go to step number', type: 'number', validation: (rule) => rule.required().min(1) }),
          ],
          preview: {
            select: { afterStep: 'afterStep', field: 'field', goToStep: 'goToStep' },
            prepare: ({ afterStep, field, goToStep }) => ({
              title: `After step ${afterStep}, if ${field} matches, go to step ${goToStep}`,
            }),
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current', fields: 'fields' },
    prepare: ({ title, slug, fields }) => {
      const count = Array.isArray(fields) ? fields.length : 0
      return { title: title || 'Form', subtitle: `${slug ? `/${slug}` : 'no slug'} · ${count} item${count === 1 ? '' : 's'}` }
    },
  },
})
