import { defineArrayMember, defineField, defineType } from 'sanity'

/** Numbered process steps in a plain (borderless) grid, e.g. the saliXus Process Advantage. */
export const processSteps = defineType({
  name: 'processSteps',
  title: 'Process Steps',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({ name: 'number', title: 'Number', type: 'number' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 4 }),
          ],
          preview: { select: { title: 'title', subtitle: 'number' } },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      initialValue: '3',
      options: { list: [{ title: '3', value: '3' }, { title: '2', value: '2' }] },
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'steps' },
    prepare: ({ title, items }) => ({ title: title || 'Process steps', subtitle: `${Array.isArray(items) ? items.length : 0} steps` }),
  },
})
