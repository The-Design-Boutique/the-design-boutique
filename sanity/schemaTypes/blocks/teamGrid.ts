import { defineArrayMember, defineField, defineType } from 'sanity'

/** A grid of team members: photo, name, and role/bio. */
export const teamGrid = defineType({
  name: 'teamGrid',
  title: 'Team Grid',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
    defineField({
      name: 'members',
      title: 'Members',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'member',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'role', title: 'Role / bio', type: 'text', rows: 3 }),
            defineField({ name: 'photo', title: 'Photo', type: 'imageWithAlt' }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'members' },
    prepare: ({ title, items }) => ({ title: title || 'Team', subtitle: `${Array.isArray(items) ? items.length : 0} members` }),
  },
})
