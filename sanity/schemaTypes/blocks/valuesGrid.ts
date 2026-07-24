import { defineArrayMember, defineField, defineType } from 'sanity'

const TREES = [
  { title: 'Hyperion', value: 'hyperion' },
  { title: 'Doerner', value: 'doerner' },
  { title: 'Menara', value: 'menara' },
  { title: 'Kashmir', value: 'kashmir' },
  { title: 'Centurion', value: 'centurion' },
  { title: 'Rainbow Eucalyptus', value: 'rainbow-eucalyptus' },
]

/** Company values, each keyed to a "giant of the forest" tree icon (Vision & Values). */
export const valuesGrid = defineType({
  name: 'valuesGrid',
  title: 'Values Grid',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
    defineField({
      name: 'values',
      title: 'Values',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'value',
          fields: [
            defineField({ name: 'tree', title: 'Tree icon', type: 'string', options: { list: TREES } }),
            defineField({ name: 'name', title: 'Tree name', type: 'string' }),
            defineField({ name: 'equation', title: 'Equation (e.g. "Honesty + Honor =")', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'equation', subtitle: 'name' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'values' },
    prepare: ({ title, items }) => ({ title: title || 'Values', subtitle: `${Array.isArray(items) ? items.length : 0} values` }),
  },
})
