import { defineArrayMember, defineField, defineType } from 'sanity'

/** Portfolio/work cards: image + category + title, each linking to a detail page. */
export const workGrid = defineType({
  name: 'workGrid',
  title: 'Work Grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'workItem',
          fields: [
            defineField({ name: 'image', title: 'Image', type: 'imageWithAlt' }),
            defineField({ name: 'category', title: 'Category', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'href', title: 'Link', type: 'string' }),
          ],
          preview: { select: { title: 'title', subtitle: 'category', media: 'image' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'items' },
    prepare: ({ title, items }) => ({ title: title || 'Work', subtitle: `${Array.isArray(items) ? items.length : 0} items` }),
  },
})
