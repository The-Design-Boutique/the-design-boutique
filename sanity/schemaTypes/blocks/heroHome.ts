import { defineArrayMember, defineField, defineType } from 'sanity'

export const heroHome = defineType({
  name: 'heroHome',
  title: 'Hero (Home)',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'headline', title: 'Headline', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'subhead', title: 'Subhead', type: 'text', rows: 2 }),
    defineField({ name: 'backgroundImage', title: 'Background image', type: 'imageWithAlt' }),
    defineField({ name: 'videoUrl', title: 'Play-ring video URL', type: 'url', description: 'The signature "Laney Said" spinning play-video ring.' }),
    defineField({ name: 'ctas', title: 'Buttons', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'headline' }, prepare: ({ title }) => ({ title: title || 'Hero', subtitle: 'Home hero' }) },
})
