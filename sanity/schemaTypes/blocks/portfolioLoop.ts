import { defineField, defineType } from 'sanity'

export const portfolioLoop = defineType({
  name: 'portfolioLoop',
  title: 'Portfolio Loop (auto)',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'category', title: 'Filter by category', type: 'reference', to: [{ type: 'clientCategory' }], description: 'Optional. Leave empty to show all clients.' }),
    defineField({ name: 'limit', title: 'Max items', type: 'number', initialValue: 12, validation: (Rule) => Rule.min(1).max(48) }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Portfolio loop', subtitle: 'Auto-populated from Clients' }) },
})
