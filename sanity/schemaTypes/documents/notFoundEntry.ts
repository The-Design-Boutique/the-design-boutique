import { defineField, defineType } from 'sanity'

/**
 * One dead URL, on one day, with how many times it was hit
 * (SOW 2.5, ruleset 05 section 4, rule 14).
 *
 * Aggregated per path per day rather than logged per request, so a bot hitting
 * the same dead URL a thousand times produces one document with a count of a
 * thousand, not a thousand documents.
 *
 * These are written by the site, not by editors. The 404 monitor in the Studio
 * is the place to look at them.
 */
export const notFoundEntry = defineType({
  name: 'notFoundEntry',
  title: '404',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({ name: 'path', title: 'Path', type: 'string' }),
    defineField({ name: 'day', title: 'Day', type: 'date' }),
    defineField({ name: 'count', title: 'Hits', type: 'number', initialValue: 1 }),
    defineField({
      name: 'referrer',
      title: 'Last referrer',
      type: 'string',
      description: 'Where the visitor came from, when the browser told us. A referrer from this site means we are linking to a dead page.',
    }),
    defineField({ name: 'firstSeenAt', title: 'First seen', type: 'datetime' }),
    defineField({ name: 'lastSeenAt', title: 'Last seen', type: 'datetime' }),
    defineField({
      name: 'resolved',
      title: 'Resolved',
      type: 'boolean',
      initialValue: false,
      description: 'Set when a redirect is created for this path.',
    }),
  ],
  orderings: [
    { title: 'Most hits', name: 'hits', by: [{ field: 'count', direction: 'desc' }] },
    { title: 'Most recent', name: 'recent', by: [{ field: 'lastSeenAt', direction: 'desc' }] },
  ],
  preview: {
    select: { path: 'path', count: 'count', day: 'day', resolved: 'resolved' },
    prepare: ({ path, count, day, resolved }) => ({
      title: path || '(unknown path)',
      subtitle: `${count || 1} hit${count === 1 ? '' : 's'} on ${day}${resolved ? ' · redirected' : ''}`,
    }),
  },
})
