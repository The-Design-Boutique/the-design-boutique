import { defineArrayMember, defineField, defineType } from 'sanity'

/** Site navigation (singleton): header menu with dropdowns, header CTA, footer columns. */
export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  groups: [
    { name: 'header', title: 'Header', default: true },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    defineField({
      name: 'headerMenu',
      title: 'Header menu',
      type: 'array',
      group: 'header',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navItem',
          title: 'Menu item',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'link', title: 'Link', type: 'link', description: 'Optional for items that only open a dropdown.' }),
            defineField({
              name: 'submenu',
              title: 'Dropdown items',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'subItem',
                  fields: [
                    defineField({ name: 'label', title: 'Label', type: 'string' }),
                    defineField({ name: 'link', title: 'Link', type: 'link' }),
                  ],
                  preview: { select: { title: 'label' } },
                }),
              ],
            }),
          ],
          preview: { select: { title: 'label' } },
        }),
      ],
    }),
    defineField({
      name: 'headerCta',
      title: 'Header button',
      type: 'object',
      group: 'header',
      description: 'The button in the header, e.g. "Hire Us!".',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'link', title: 'Link', type: 'link' }),
      ],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer columns',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({ name: 'title', title: 'Column title', type: 'string' }),
            defineField({ name: 'links', title: 'Links', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
          ],
          preview: { select: { title: 'title' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Navigation' }) },
})
