import { defineField, defineType } from 'sanity'

/** An embedded video inside a blog post body (YouTube or Vimeo). */
export const bodyVideo = defineType({
  name: 'bodyVideo',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({ name: 'url', title: 'Video URL', type: 'url', validation: (Rule) => Rule.required() }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
  ],
  preview: {
    select: { title: 'caption', subtitle: 'url' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Video', subtitle }),
  },
})
