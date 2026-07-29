import { defineField, defineType } from 'sanity'
import { AltTextInput } from '../../components/AltTextInput'

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
      // Adds a button that looks at the picture and drafts this, when the
      // writing assistant is switched on. Renders as a plain field otherwise.
      components: { input: AltTextInput },
      validation: (Rule) => Rule.required().warning('Add alt text for accessibility and SEO.'),
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      description: 'In rich text, "Float right" wraps the surrounding copy around the image.',
      options: { list: [{ title: 'Default (full width)', value: 'default' }, { title: 'Float right', value: 'right' }] },
    }),
  ],
})
