import { defineField, defineType } from 'sanity'

export const newsletterSignup = defineType({
  name: 'newsletterSignup',
  title: 'Newsletter Signup',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
    defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Subscribe' }),
    defineField({ name: 'disclaimer', title: 'Disclaimer', type: 'text', rows: 2 }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Newsletter', subtitle: 'Newsletter signup' }) },
})
