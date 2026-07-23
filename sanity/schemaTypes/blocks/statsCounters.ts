import { defineArrayMember, defineField, defineType } from 'sanity'

export const statsCounters = defineType({
  name: 'statsCounters',
  title: 'Stats / Counters',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string', description: 'e.g. 0, 10, 1 billion. Animates counting up on the frontend.', validation: (Rule) => Rule.required() }),
            defineField({ name: 'prefix', title: 'Prefix', type: 'string' }),
            defineField({ name: 'suffix', title: 'Suffix', type: 'string', description: 'e.g. %, +' }),
            defineField({ name: 'label', title: 'Label', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Stats', subtitle: 'Stats / counters' }) },
})
