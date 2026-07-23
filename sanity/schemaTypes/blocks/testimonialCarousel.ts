import { defineArrayMember, defineField, defineType } from 'sanity'

export const testimonialCarousel = defineType({
  name: 'testimonialCarousel',
  title: 'Testimonial Carousel',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })],
      description: 'Leave empty to auto-show featured testimonials.',
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'testimonials' },
    prepare: ({ title, items }) => ({ title: title || 'Testimonials', subtitle: `${Array.isArray(items) ? items.length : 0} selected` }),
  },
})
