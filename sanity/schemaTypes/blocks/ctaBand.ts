import { defineArrayMember, defineField, defineType } from 'sanity'

export const ctaBand = defineType({
  name: 'ctaBand',
  title: 'CTA Band',
  type: 'object',
  fields: [
    defineField({ name: 'headline', title: 'Headline', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
    defineField({ name: 'underlineLastLine', title: 'Underline last line', type: 'boolean', description: 'Underline the final line of the headline (e.g. "Let\'s Go!").' }),
    defineField({ name: 'ctas', title: 'Buttons', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'headline' }, prepare: ({ title }) => ({ title: title || 'CTA', subtitle: 'Call to action' }) },
})
