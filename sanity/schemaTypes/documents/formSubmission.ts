import { defineField, defineType } from 'sanity'

/** Contact form submissions (created by the /api/contact route). Read-only in the Studio. */
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
  ],
  orderings: [{ name: 'newest', title: 'Newest first', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'email', at: 'submittedAt' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Submission', subtitle }),
  },
})
