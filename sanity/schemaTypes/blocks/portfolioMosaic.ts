import { defineArrayMember, defineField, defineType } from 'sanity'

export const portfolioMosaic = defineType({
  name: 'portfolioMosaic',
  title: 'Portfolio Mosaic',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'clients',
      title: 'Clients',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'client' }] })],
      description: 'Hand-picked clients shown in the mosaic.',
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', clients: 'clients' },
    prepare: ({ title, clients }) => ({ title: title || 'Portfolio mosaic', subtitle: `${Array.isArray(clients) ? clients.length : 0} client(s)` }),
  },
})
