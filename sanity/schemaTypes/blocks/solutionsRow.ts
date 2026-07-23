import { defineArrayMember, defineField, defineType } from 'sanity'

export const solutionsRow = defineType({
  name: 'solutionsRow',
  title: 'Solutions Row',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [defineArrayMember({ type: 'block' })] }),
    defineField({ name: 'image', title: 'Image', type: 'imageWithAlt' }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url' }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      initialValue: 'mediaRight',
      options: {
        list: [
          { title: 'Media on the right', value: 'mediaRight' },
          { title: 'Media on the left', value: 'mediaLeft' },
          { title: 'Tall media', value: 'tall' },
          { title: 'Video feature', value: 'video' },
        ],
      },
    }),
    defineField({ name: 'ctas', title: 'Buttons', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: { select: { title: 'heading', subtitle: 'layout' }, prepare: ({ title, subtitle }) => ({ title: title || 'Solutions row', subtitle: `Solutions row (${subtitle || 'mediaRight'})` }) },
})
