import { defineArrayMember, defineField, defineType } from 'sanity'

export const contactForm = defineType({
  name: 'contactForm',
  title: 'Contact Form',
  type: 'object',
  fields: [
    defineField({ name: 'leftHeading', title: 'Left heading', type: 'string', description: 'Heading for the left column (e.g. "We know what the algorithms want...").' }),
    defineField({ name: 'leftBody', title: 'Left body', type: 'text', rows: 2 }),
    defineField({ name: 'bullets', title: 'Left bullets', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'address', title: 'Address / contact line', type: 'text', rows: 2 }),
    defineField({ name: 'addressHeading', title: 'Address heading', type: 'string', initialValue: 'Contact Us:' }),
    defineField({ name: 'addressLines', title: 'Address lines', type: 'text', rows: 2 }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
    defineField({ name: 'submitLabel', title: 'Submit button label', type: 'string', initialValue: 'Send a Message' }),
    defineField({ name: 'successMessage', title: 'Success message', type: 'string', initialValue: 'Thanks, we will be in touch shortly.' }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Contact form', subtitle: 'Contact form' }) },
})
