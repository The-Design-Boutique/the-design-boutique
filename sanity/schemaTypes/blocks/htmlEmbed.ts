import { defineField, defineType } from 'sanity'

export const htmlEmbed = defineType({
  name: 'htmlEmbed',
  title: 'HTML Embed',
  type: 'object',
  fields: [
    defineField({ name: 'html', title: 'HTML', type: 'text', rows: 8, description: 'Raw HTML / embed code. Use sparingly.', validation: (Rule) => Rule.required() }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { prepare: () => ({ title: 'HTML embed', subtitle: 'Custom HTML' }) },
})
