import { defineField, defineType } from 'sanity'

/** Shared link object: either an internal page reference or an external URL. */
export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({
      name: 'type',
      title: 'Link to',
      type: 'string',
      initialValue: 'internal',
      options: {
        list: [
          { title: 'A page on this site', value: 'internal' },
          { title: 'An external URL', value: 'external' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'internal',
      title: 'Page',
      type: 'reference',
      to: [{ type: 'page' }],
      hidden: ({ parent }) => (parent as { type?: string })?.type !== 'internal',
    }),
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      hidden: ({ parent }) => (parent as { type?: string })?.type !== 'external',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
    }),
    defineField({ name: 'openInNewTab', title: 'Open in a new tab', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { label: 'label', type: 'type', href: 'href' },
    prepare: ({ label, type, href }) => ({ title: label || href || 'Link', subtitle: type }),
  },
})
