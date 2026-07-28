import { defineField, defineType } from 'sanity'

/**
 * Places a form built in Forms by Angelo onto a page.
 *
 * The form itself is a separate document, so the same form can appear in more
 * than one place and only has to be edited once.
 */
export const formEmbed = defineType({
  name: 'formEmbed',
  title: 'Form',
  type: 'object',
  fieldsets: [{ name: 'split', title: 'Left column (two-column layout only)', options: { collapsible: true, collapsed: true } }],
  fields: [
    defineField({
      name: 'form',
      title: 'Which form',
      type: 'reference',
      to: [{ type: 'form' }],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', description: 'Small line above the heading.' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string', description: 'Optional heading shown above the form.' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2, description: 'Optional line of copy above the form.' }),
    defineField({
      name: 'variant',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          { title: 'Two columns (intro beside the form)', value: 'split' },
          { title: 'Centred', value: 'centered' },
          { title: 'Plain', value: 'inline' },
          { title: 'In a card', value: 'card' },
        ],
        layout: 'radio',
      },
      initialValue: 'centered',
    }),
    // The two-column layout Laney's contact section uses on most pages: an
    // intro column on the left, the form on the right.
    defineField({ name: 'leftHeading', title: 'Left heading', type: 'string', fieldset: 'split' }),
    defineField({ name: 'leftBody', title: 'Left body', type: 'text', rows: 2, fieldset: 'split' }),
    defineField({ name: 'bullets', title: 'Left bullets', type: 'array', of: [{ type: 'string' }], fieldset: 'split' }),
    defineField({ name: 'addressHeading', title: 'Address heading', type: 'string', fieldset: 'split' }),
    defineField({ name: 'addressLines', title: 'Address lines', type: 'text', rows: 2, fieldset: 'split' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', fieldset: 'split' }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'form.title', heading: 'heading' },
    prepare: ({ title, heading }) => ({ title: heading || title || 'Form', subtitle: 'Form' }),
  },
})
