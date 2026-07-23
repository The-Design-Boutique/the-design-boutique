import { defineField, defineType } from 'sanity'

export const contactForm = defineType({
  name: 'contactForm',
  title: 'Contact Form',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
    defineField({ name: 'submitLabel', title: 'Submit button label', type: 'string', initialValue: 'Send a Message' }),
    defineField({ name: 'successMessage', title: 'Success message', type: 'string', initialValue: 'Thanks, we will be in touch shortly.' }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Contact form', subtitle: 'Contact form' }) },
})
