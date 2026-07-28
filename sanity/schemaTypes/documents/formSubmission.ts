import { defineField, defineType } from 'sanity'

/**
 * A form submission. Read-only in the Studio: these are records of what
 * somebody sent, and editing them would make the record untrue.
 *
 * Forms built in Forms by Angelo can ask anything, so the answers are stored as
 * label and value pairs rather than fixed fields. The older name, email and
 * message fields are still filled in when a form has them, because they make
 * the list readable at a glance and drive the preview.
 */
export const formSubmission = defineType({
  name: 'formSubmission',
  title: 'Form Submission',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'message', title: 'Message', type: 'text' }),
    defineField({ name: 'pageUrl', title: 'Page', type: 'string' }),
    defineField({ name: 'submittedAt', title: 'Submitted at', type: 'datetime' }),
    defineField({ name: 'formTitle', title: 'Form', type: 'string' }),
    defineField({ name: 'formSlug', title: 'Form slug', type: 'string' }),
    defineField({
      name: 'answers',
      title: 'Answers',
      type: 'array',
      description: 'Every answer given, in the order the questions were asked.',
      of: [
        {
          type: 'object',
          name: 'answer',
          fields: [
            defineField({ name: 'label', title: 'Question', type: 'string' }),
            defineField({ name: 'name', title: 'Field name', type: 'string' }),
            defineField({ name: 'value', title: 'Answer', type: 'text', rows: 2 }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'value' },
            prepare: ({ title, subtitle }) => ({ title: title || 'Answer', subtitle }),
          },
        },
      ],
    }),
    // Where the enquiry came from, captured automatically.
    defineField({ name: 'utmSource', title: 'Campaign source', type: 'string' }),
    defineField({ name: 'utmMedium', title: 'Campaign medium', type: 'string' }),
    defineField({ name: 'utmCampaign', title: 'Campaign name', type: 'string' }),
    defineField({ name: 'referrer', title: 'Referrer', type: 'string' }),
  ],
  orderings: [{ name: 'newest', title: 'Newest first', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'email', formTitle: 'formTitle', at: 'submittedAt' },
    prepare: ({ title, subtitle, formTitle, at }) => ({
      title: title || 'Submission',
      subtitle: [subtitle, formTitle, at ? new Date(at).toLocaleDateString() : null].filter(Boolean).join(' · '),
    }),
  },
})
