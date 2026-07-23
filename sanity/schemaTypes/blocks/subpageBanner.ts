import { defineField, defineType } from 'sanity'

export const subpageBanner = defineType({
  name: 'subpageBanner',
  title: 'Subpage Banner',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2 }),
    defineField({ name: 'backgroundImage', title: 'Background image', type: 'imageWithAlt' }),
    defineField({ name: 'cta', title: 'Button', type: 'link' }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: title || 'Banner', subtitle: 'Subpage banner' }) },
})
