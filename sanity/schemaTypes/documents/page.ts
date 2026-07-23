import { defineField, defineType } from 'sanity'
import { blockArrayMembers } from '../blocks'

/**
 * Page document: title, slug, the page-builder block array, and the shared SEO
 * stack. Frontend rendering of the blocks arrives in Phase 2 (BlockRenderer).
 */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'content',
      description: 'The page address, e.g. "about". Generated from the title.',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Page content',
      type: 'array',
      group: 'content',
      of: blockArrayMembers,
      options: { insertMenu: { views: [{ name: 'grid' }, { name: 'list' }] } },
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({
      title: title || 'Untitled page',
      subtitle: slug ? `/${slug}` : 'no slug set',
    }),
  },
})
