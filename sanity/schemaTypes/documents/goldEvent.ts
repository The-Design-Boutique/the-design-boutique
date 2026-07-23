import { defineArrayMember, defineField, defineType } from 'sanity'

/** Gold Events: the video/talk series (CPT "gold" on the live site). */
export const goldEvent = defineType({
  name: 'goldEvent',
  title: 'Gold Event',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'URL slug', type: 'slug', group: 'content', options: { source: 'title', maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'presenter', title: 'Presenter', type: 'string', group: 'content' }),
    defineField({ name: 'date', title: 'Date', type: 'date', group: 'content' }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url', group: 'content' }),
    defineField({ name: 'coverImage', title: 'Cover image', type: 'imageWithAlt', group: 'content' }),
    defineField({ name: 'description', title: 'Description', type: 'array', group: 'content', of: [defineArrayMember({ type: 'block' })] }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoFields', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'presenter', media: 'coverImage' },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle: subtitle ? `Presenter: ${subtitle}` : undefined, media }),
  },
})
