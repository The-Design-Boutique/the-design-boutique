import { defineField, defineType } from 'sanity'

/** The Laney Said index grid. Posts are pulled automatically, newest first. */
export const postGrid = defineType({
  name: 'postGrid',
  title: 'Post Grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'limit',
      title: 'Maximum posts',
      type: 'number',
      description: 'Leave empty to show every published post.',
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { prepare: () => ({ title: 'Post Grid', subtitle: 'All posts, newest first' }) },
})
