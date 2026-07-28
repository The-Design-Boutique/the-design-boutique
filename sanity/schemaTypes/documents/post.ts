import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Blog post, brand-named "Laney Said" on the live site.
 *
 * Routable at /{slug}, at the root, matching the live WordPress site. Not
 * /blog/{slug}: that address 404s here and 301s to the root on the live site.
 * /blog is the archive listing, which is a page rather than a post.
 */
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
    defineField({ name: 'categories', title: 'Categories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }], group: 'content', description: 'Posts on the live site carry several categories.' }),
    defineField({ name: 'featuredImage', title: 'Featured image', type: 'imageWithAlt', group: 'content' }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, group: 'content', description: 'Short summary for listings and social sharing.' }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({
        type: 'block',
        styles: [
          { title: 'Normal', value: 'normal' },
          { title: 'Heading 1', value: 'h1' },
          { title: 'Heading 2', value: 'h2' },
          { title: 'Heading 3', value: 'h3' },
          { title: 'Heading 4', value: 'h4' },
          { title: 'Heading 5', value: 'h5' },
          { title: 'Heading 6', value: 'h6' },
          { title: 'Quote', value: 'blockquote' },
        ],
      }), defineArrayMember({ type: 'imageWithAlt' }), defineArrayMember({ type: 'bodyVideo' }), defineArrayMember({ type: 'bodyHtml' })],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoFields', group: 'seo',
      // Blog posts are articles.
      initialValue: { schemaType: 'Article' } }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current', media: 'featuredImage' },
    // The subtitle is the address someone will copy or click, so it has to be
    // the real one. It said /blog/{slug} here, which does not exist.
    prepare: ({ title, slug, media }) => ({ title: title || 'Untitled', subtitle: slug ? `/${slug}` : 'no slug', media }),
  },
})
