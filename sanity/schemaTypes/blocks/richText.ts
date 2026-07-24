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
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Eyebrow', value: 'eyebrow' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Heading 4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
        }),
        defineArrayMember({ type: 'imageWithAlt' }),
      ],
    }),
    defineField({ name: 'wideWithLeaf', title: 'Wide with side leaf', type: 'boolean', description: 'Full-width content on the left with the redwood leaf motif on the right (e.g. the About bio).' }),
    defineField({ name: 'wide', title: 'Wide (left-aligned, no leaf)', type: 'boolean', description: 'Full-width, left-aligned prose with no side motif (e.g. Our Vision).' }),
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
