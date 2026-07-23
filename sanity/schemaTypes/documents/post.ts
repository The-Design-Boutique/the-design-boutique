import { defineArrayMember, defineField, defineType } from 'sanity'

/** Blog post, brand-named "Laney Said" on the live site. Routable at /blog/{slug}. */
export const post = defineType({
  name: 'post',
  title: 'Laney Said (Blog)',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'URL slug', type: 'slug', group: 'content', options: { source: 'title', maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime', group: 'content', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }], group: 'content' }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }], group: 'content' }),
    defineField({ name: 'featuredImage', title: 'Featured image', type: 'imageWithAlt', group: 'content' }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, group: 'content', description: 'Short summary for listings and social sharing.' }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'imageWithAlt' })],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoFields', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current', media: 'featuredImage' },
    prepare: ({ title, slug, media }) => ({ title: title || 'Untitled', subtitle: slug ? `/blog/${slug}` : 'no slug', media }),
  },
})
