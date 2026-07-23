import { defineField, defineType } from 'sanity'

/** Shared per-block presentation settings: background, spacing, anchor. */
export const sectionSettings = defineType({
  name: 'sectionSettings',
  title: 'Section settings',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      initialValue: 'black',
      options: {
        list: [
          { title: 'Black (default)', value: 'black' },
          { title: 'Dark gray', value: 'dark' },
          { title: 'Forest motif', value: 'forest' },
          { title: 'Leaf motif', value: 'leaf' },
          { title: 'Leaves motif', value: 'leaves' },
          { title: 'White', value: 'white' },
        ],
      },
    }),
    defineField({
      name: 'paddingTop',
      title: 'Top spacing',
      type: 'string',
      initialValue: 'large',
      options: { list: ['none', 'small', 'medium', 'large'] },
    }),
    defineField({
      name: 'paddingBottom',
      title: 'Bottom spacing',
      type: 'string',
      initialValue: 'large',
      options: { list: ['none', 'small', 'medium', 'large'] },
    }),
    defineField({
      name: 'anchorId',
      title: 'Anchor ID',
      type: 'string',
      description: 'Optional. Lets other links jump to this section (e.g. "contact").',
    }),
  ],
})
