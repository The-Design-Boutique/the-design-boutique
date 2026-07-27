import { defineArrayMember, defineField, defineType } from 'sanity'

/** Masonry grid of past events / episodes (the Gold page). */
export const eventGrid = defineType({
  name: 'eventGrid',
  title: 'Event Grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Events',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'eventItem',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'date', title: 'Date', type: 'string', description: 'Display date, e.g. "April 29, 2026".' }),
            defineField({ name: 'href', title: 'Link', type: 'string' }),
            defineField({ name: 'linkLabel', title: 'Link label', type: 'string', initialValue: 'Replay' }),
            defineField({ name: 'presenter', title: 'Presenter', type: 'string' }),
          ],
          preview: { select: { title: 'title', subtitle: 'date' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'items' },
    prepare: ({ title, items }) => ({ title: title || 'Events', subtitle: `${Array.isArray(items) ? items.length : 0} events` }),
  },
})
