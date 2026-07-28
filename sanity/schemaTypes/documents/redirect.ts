import { defineField, defineType } from 'sanity'

/**
 * A redirect from an old path to where that content lives now
 * (SOW 2.5, ruleset 05 section 4).
 *
 * Created either by hand here, from a dead URL in the 404 monitor, or
 * automatically when an editor changes a published page's slug.
 */
export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  fields: [
    defineField({
      name: 'fromPath',
      title: 'Old path',
      type: 'string',
      description: 'The path that should redirect, starting with a slash. For example /old-services. Do not include the domain.',
      validation: (Rule) =>
        Rule.required()
          .custom((value) => {
            if (typeof value !== 'string' || !value.trim()) return 'An old path is required.'
            const v = value.trim()
            if (/^https?:\/\//i.test(v)) return 'Enter just the path, without the domain.'
            if (!v.startsWith('/')) return 'The path must start with a slash.'
            if (v === '/') return 'The site root cannot be redirected.'
            if (/\s/.test(v)) return 'A path cannot contain spaces.'
            return true
          }),
    }),
    defineField({
      name: 'targetType',
      title: 'Send visitors to',
      type: 'string',
      initialValue: 'path',
      options: {
        list: [
          { title: 'A path or URL', value: 'path' },
          { title: 'A page on this site', value: 'page' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'toPath',
      title: 'New path or URL',
      type: 'string',
      description: 'A path on this site like /services, or a full address like https://example.com.',
      hidden: ({ parent }) => (parent as { targetType?: string })?.targetType === 'page',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { targetType?: string; fromPath?: string } | undefined
          if (parent?.targetType === 'page') return true
          if (typeof value !== 'string' || !value.trim()) return 'A destination is required.'
          const v = value.trim()
          if (!/^https?:\/\//i.test(v) && !v.startsWith('/')) {
            return 'Enter a path starting with a slash, or a full address starting with https://.'
          }
          if (parent?.fromPath && v.replace(/\/+$/, '').toLowerCase() === parent.fromPath.replace(/\/+$/, '').toLowerCase()) {
            return 'This points at itself, which would loop forever.'
          }
          return true
        }),
    }),
    defineField({
      name: 'toPage',
      title: 'Page',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'post' }, { type: 'client' }, { type: 'goldEvent' }],
      hidden: ({ parent }) => (parent as { targetType?: string })?.targetType !== 'page',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { targetType?: string } | undefined
          if (parent?.targetType !== 'page') return true
          return value ? true : 'Choose the page to send visitors to.'
        }),
    }),
    defineField({
      name: 'statusCode',
      title: 'Type',
      type: 'number',
      initialValue: 301,
      description: 'Permanent tells search engines the move is final and passes on the old page’s ranking. Use temporary only when the page will come back.',
      options: {
        list: [
          { title: 'Permanent (301)', value: 301 },
          { title: 'Temporary (302)', value: 302 },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'enabled',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to stop the redirect without deleting it.',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 2,
      description: 'Why this redirect exists. Useful when someone revisits it a year from now.',
    }),
    defineField({
      name: 'createdBy',
      title: 'Created by',
      type: 'string',
      readOnly: true,
      description: 'Set automatically.',
    }),
    // Written by the middleware when the redirect fires, so an editor can see
    // which redirects are earning their keep and which are dead weight.
    defineField({ name: 'hitCount', title: 'Times used', type: 'number', initialValue: 0, readOnly: true }),
    defineField({ name: 'lastHitAt', title: 'Last used', type: 'datetime', readOnly: true }),
  ],
  orderings: [
    { title: 'Most used', name: 'hits', by: [{ field: 'hitCount', direction: 'desc' }] },
    { title: 'Recently created', name: 'created', by: [{ field: '_createdAt', direction: 'desc' }] },
    { title: 'Old path', name: 'from', by: [{ field: 'fromPath', direction: 'asc' }] },
  ],
  preview: {
    select: { from: 'fromPath', to: 'toPath', page: 'toPage.title', code: 'statusCode', enabled: 'enabled', hits: 'hitCount' },
    prepare: ({ from, to, page, code, enabled, hits }) => ({
      title: `${from || '(no path)'} → ${page || to || '(nowhere)'}`,
      subtitle: `${code || 301}${enabled === false ? ' · off' : ''}${hits ? ` · used ${hits}×` : ''}`,
    }),
  },
})
