import { defineArrayMember, defineField, defineType } from 'sanity'

export const industriesSection = defineType({
  name: 'industriesSection',
  title: 'Industries Section',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 4 }),
    defineField({ name: 'statsHeading', title: 'Stats heading', type: 'string' }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string' }),
            defineField({ name: 'suffix', title: 'Suffix', type: 'string' }),
            defineField({ name: 'label', title: 'Label', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
    }),
    defineField({
      name: 'cards',
      title: 'Industry cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'industryCard',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        }),
      ],
    }),
    defineField({ name: 'cardsHoverImage', title: 'Card hover image', type: 'image', description: 'Photo revealed behind the industry cards on hover.' }),
    defineField({ name: 'cardsLink', title: 'Card link', type: 'link', description: 'Where the industry cards link to.' }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Industries', subtitle: 'Industries' }) },
})
