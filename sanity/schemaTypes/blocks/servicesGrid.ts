import { defineArrayMember, defineField, defineType } from 'sanity'

export const servicesGrid = defineType({
  name: 'servicesGrid',
  title: 'Services Grid',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'service',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
            defineField({ name: 'iconImage', title: 'Icon', type: 'image', description: 'Line-art icon shown at the top of the card.' }),
            defineField({ name: 'hoverImage', title: 'Hover background', type: 'image', description: 'Photo revealed behind the card on hover.' }),
            defineField({ name: 'icon', title: 'Icon key (legacy)', type: 'string', hidden: true }),
            defineField({ name: 'link', title: 'Link', type: 'link' }),
          ],
          preview: { select: { title: 'title', subtitle: 'description', media: 'iconImage' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Services grid', subtitle: 'Services grid' }) },
})
