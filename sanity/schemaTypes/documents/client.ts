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
    defineField({ name: 'websiteUrl', title: 'Client website', type: 'url', group: 'content' }),
    defineField({ name: 'gallery', title: 'Gallery', type: 'array', of: [{ type: 'imageWithAlt' }], group: 'content', description: 'Masonry gallery below the cover image.' }),
    defineField({ name: 'industry', title: 'Industry', type: 'string', group: 'content', description: 'Left rail on the case study, e.g. "Legal".' }),
    defineField({ name: 'services', title: 'Services', type: 'array', of: [{ type: 'string' }], group: 'content', description: 'Left rail list. A trailing "Digital Marketing | Bronzo" style entry renders the tier in the accent colour.' }),
    defineField({
      name: 'body',
      title: 'Case study',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'imageWithAlt' }), defineArrayMember({ type: 'bodyVideo' }), defineArrayMember({ type: 'bodyHtml' })],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoFields', group: 'seo',
      // Case studies read as articles.
      initialValue: { schemaType: 'Article' } }),
  ],
  preview: {
    select: { title: 'title', category: 'category.title', media: 'logo' },
    prepare: ({ title, category, media }) => ({ title, subtitle: category, media }),
  },
})
