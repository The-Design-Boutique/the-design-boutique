import { defineField, defineType } from 'sanity'

export const testimonialSingle = defineType({
  name: 'testimonialSingle',
  title: 'Testimonial (Single)',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'testimonial', title: 'Testimonial', type: 'reference', to: [{ type: 'testimonial' }], description: 'A featured single quote, e.g. the Joe Montana endorsement.', validation: (Rule) => Rule.required() }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { name: 'testimonial.name', role: 'testimonial.roleCompany', media: 'testimonial.image' },
    prepare: ({ name, role, media }) => ({ title: name || 'Testimonial', subtitle: role || 'Single testimonial', media }),
  },
})
