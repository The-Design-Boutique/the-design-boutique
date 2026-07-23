import { defineArrayMember, defineField, defineType } from 'sanity'

/** Portfolio "Client" (labeled Clients on the live site). Case-study / work item. */
export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Client name', type: 'string', group: 'content', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'URL slug', type: 'slug', group: 'content', options: { source: 'title', maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'logo', title: 'Logo', type: 'imageWithAlt', group: 'content' }),
    defineField({ name: 'category', title: 'Client category', type: 'reference', to: [{ type: 'clientCategory' }], group: 'content' }),
    defineField({ name: 'featuredImage', title: 'Featured image', type: 'imageWithAlt', group: 'content' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, group: 'content' }),
    defineField({
      name: 'body',
      title: 'Case study',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'imageWithAlt' })],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoFields', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', category: 'category.title', media: 'logo' },
    prepare: ({ title, category, media }) => ({ title, subtitle: category, media }),
  },
})
