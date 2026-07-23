import { defineArrayMember, defineField, defineType } from 'sanity'

export const clientInfo = defineType({
  name: 'clientInfo',
  title: 'Client Info',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'array', of: [defineArrayMember({ type: 'block' })] }),
    defineField({
      name: 'meta',
      title: 'Detail rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'metaRow',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'value', title: 'Value', type: 'string' }),
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Client info', subtitle: 'Client info' }) },
})
