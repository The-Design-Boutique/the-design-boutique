import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'roleCompany', title: 'Role / Company', type: 'string' }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 4, validation: (Rule) => Rule.required() }),
    defineField({ name: 'image', title: 'Photo', type: 'imageWithAlt' }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url', description: 'Optional video testimonial.' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false, description: 'Highlight this one (e.g. the Joe Montana testimonial).' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'roleCompany', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle, media }),
  },
})
