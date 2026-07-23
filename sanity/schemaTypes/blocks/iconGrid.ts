import { defineArrayMember, defineField, defineType } from 'sanity'

export const iconGrid = defineType({
  name: 'iconGrid',
  title: 'Icon Grid',
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
          name: 'iconItem',
          fields: [
            defineField({ name: 'icon', title: 'Icon', type: 'string', description: 'Icon key (mapped on the frontend).' }),
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Icon grid', subtitle: 'Icon grid' }) },
})
