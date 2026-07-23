import { defineField, defineType } from 'sanity'

export const videoEmbed = defineType({
  name: 'videoEmbed',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url', validation: (Rule) => Rule.required() }),
    defineField({ name: 'poster', title: 'Poster image', type: 'imageWithAlt' }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading', subtitle: 'videoUrl' }, prepare: ({ title, subtitle }) => ({ title: title || 'Video', subtitle: subtitle || 'Video' }) },
})
