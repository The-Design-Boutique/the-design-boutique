import { defineArrayMember, defineField, defineType } from 'sanity'

export const flipBoxGrid = defineType({
  name: 'flipBoxGrid',
  title: 'Flip Box Grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'boxes',
      title: 'Boxes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'flipBox',
          fields: [
            defineField({ name: 'icon', title: 'Icon', type: 'string', description: 'Icon key (mapped on the frontend).' }),
            defineField({ name: 'frontTitle', title: 'Front title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'backText', title: 'Back text', type: 'text', rows: 3 }),
            defineField({ name: 'link', title: 'Link', type: 'link' }),
          ],
          preview: { select: { title: 'frontTitle', subtitle: 'backText' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', boxes: 'boxes' },
    prepare: ({ title, boxes }) => ({ title: title || 'Flip boxes', subtitle: `${Array.isArray(boxes) ? boxes.length : 0} box(es)` }),
  },
})
