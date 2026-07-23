import { defineArrayMember, defineField, defineType } from 'sanity'

export const logoWall = defineType({
  name: 'logoWall',
  title: 'Logo Wall',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'logos', title: 'Logos', type: 'array', of: [defineArrayMember({ type: 'imageWithAlt' })] }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', logos: 'logos' },
    prepare: ({ title, logos }) => ({ title: title || 'Logo wall', subtitle: `${Array.isArray(logos) ? logos.length : 0} logo(s)` }),
  },
})
