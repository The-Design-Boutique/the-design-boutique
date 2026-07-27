import { defineField, defineType } from 'sanity'

/**
 * A bespoke, fully designed article section kept as its own markup.
 *
 * A handful of Laney Said posts are hand-built HTML with their own stylesheet
 * (comparison tables, ranked cards, FAQ blocks). Portable Text cannot represent
 * those layouts, so the original markup is preserved verbatim. The CSS is
 * scoped to this block at import time so it cannot leak into the rest of the site.
 */
export const bodyHtml = defineType({
  name: 'bodyHtml',
  title: 'Custom HTML section',
  type: 'object',
  fields: [
    defineField({ name: 'html', title: 'HTML', type: 'text', rows: 12, validation: (Rule) => Rule.required() }),
    defineField({ name: 'css', title: 'Scoped CSS', type: 'text', rows: 8, description: 'Already scoped to this block. Edit with care.' }),
  ],
  preview: { prepare: () => ({ title: 'Custom HTML section' }) },
})
