import { defineArrayMember, defineField, defineType } from 'sanity'

export const workShowcase = defineType({
  name: 'workShowcase',
  title: 'Work Showcase',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'workItem',
          fields: [
            defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'link', title: 'Link', type: 'link' }),
          ],
          preview: { select: { title: 'label', media: 'image' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Work', subtitle: 'Work showcase' }) },
})
