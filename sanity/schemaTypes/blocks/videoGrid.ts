import { defineArrayMember, defineField, defineType } from 'sanity'

/** A responsive grid of click-to-play videos (e.g. client testimonial videos). */
export const videoGrid = defineType({
  name: 'videoGrid',
  title: 'Video Grid',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'layout', title: 'Layout', type: 'string', initialValue: 'grid', options: { list: [{ title: 'Grid of posters', value: 'grid' }, { title: 'Rows (video left, details right)', value: 'rows' }] } }),
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
            defineField({ name: 'role', title: 'Role / company', type: 'string' }),
            defineField({ name: 'category', title: 'Category', type: 'string', description: 'Third line, e.g. "Family Law Attorneys".' }),
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
