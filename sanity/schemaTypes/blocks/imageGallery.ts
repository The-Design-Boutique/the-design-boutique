import { defineArrayMember, defineField, defineType } from 'sanity'

export const imageGallery = defineType({
  name: 'imageGallery',
  title: 'Image Gallery',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'images', title: 'Images', type: 'array', of: [defineArrayMember({ type: 'imageWithAlt' })] }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', images: 'images' },
    prepare: ({ title, images }) => ({ title: title || 'Gallery', subtitle: `${Array.isArray(images) ? images.length : 0} image(s)` }),
  },
})
