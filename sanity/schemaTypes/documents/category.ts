import { defineField, defineType } from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Blog Category',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', group: 'content', options: { source: 'title' }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 2, group: 'content' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoFields', group: 'seo' }),
  ],
  preview: { select: { title: 'title' } },
})
