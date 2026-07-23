import { defineArrayMember, defineField, defineType } from 'sanity'

export const aboutSection = defineType({
  name: 'aboutSection',
  title: 'About Section',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 5 }),
    defineField({ name: 'image', title: 'Left image', type: 'image', description: 'The tree-shaped composite image shown on the left.' }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'aboutCard',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 4 }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        }),
      ],
      validation: (Rule) => Rule.max(2),
    }),
    defineField({ name: 'cta', title: 'Button', type: 'link' }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading', media: 'image' }, prepare: ({ title, media }) => ({ title: title || 'About section', subtitle: 'About', media }) },
})
