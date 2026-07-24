import { defineArrayMember, defineField, defineType } from 'sanity'

/** A responsive grid of click-to-play videos (e.g. client testimonial videos). */
export const videoGrid = defineType({
  name: 'videoGrid',
  title: 'Video Grid',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'videos',
      title: 'Videos',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'videoItem',
          fields: [
            defineField({ name: 'name', title: 'Name / caption', type: 'string' }),
            defineField({ name: 'videoUrl', title: 'Video URL', type: 'url' }),
            defineField({ name: 'poster', title: 'Poster image', type: 'imageWithAlt' }),
          ],
          preview: { select: { title: 'name', media: 'poster' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'videos' },
    prepare: ({ title, items }) => ({ title: title || 'Videos', subtitle: `${Array.isArray(items) ? items.length : 0} videos` }),
  },
})
