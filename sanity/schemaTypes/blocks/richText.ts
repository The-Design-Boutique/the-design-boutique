import { defineArrayMember, defineField, defineType } from 'sanity'

export const richText = defineType({
  name: 'richText',
  title: 'Rich Text',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'imageWithAlt' })],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { blocks: 'content' },
    prepare: ({ blocks }) => {
      const first = Array.isArray(blocks) ? blocks.find((b: { _type?: string }) => b._type === 'block') : undefined
      const text = first?.children?.map((c: { text?: string }) => c.text).join('') || 'Rich text'
      return { title: text, subtitle: 'Rich text' }
    },
  },
})
