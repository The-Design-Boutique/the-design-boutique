import { defineArrayMember, defineField, defineType } from 'sanity'

/** A grid of quote cards (e.g. the More Testimonials wall). */
export const quoteGrid = defineType({
  name: 'quoteGrid',
  title: 'Quote Grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Quotes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quoteItem',
          fields: [
            defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 4 }),
            defineField({ name: 'author', title: 'Author', type: 'string' }),
          ],
          preview: { select: { title: 'author', subtitle: 'quote' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'items' },
    prepare: ({ title, items }) => ({ title: title || 'Quotes', subtitle: `${Array.isArray(items) ? items.length : 0} quotes` }),
  },
})
