import { defineField, defineType } from 'sanity'

/** Shared image type with required alt text (accessibility + SEO). */
export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      description: 'Describes the image for screen readers and search engines.',
      validation: (Rule) => Rule.required().warning('Add alt text for accessibility and SEO.'),
    }),
  ],
})
