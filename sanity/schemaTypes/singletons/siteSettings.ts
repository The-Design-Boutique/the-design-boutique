import { defineArrayMember, defineField, defineType } from 'sanity'

/** Global site configuration (singleton). One document, pinned in the desk. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'social', title: 'Social' },
    { name: 'seo', title: 'SEO & Analytics' },
  ],
  fields: [
    defineField({ name: 'siteName', title: 'Site name', type: 'string', group: 'general', initialValue: 'The Design Boutique' }),
    defineField({ name: 'logo', title: 'Logo', type: 'imageWithAlt', group: 'general' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'contact' }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'contact' }),
    defineField({ name: 'address', title: 'Address', type: 'text', rows: 3, group: 'contact' }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      group: 'social',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({ name: 'platform', title: 'Platform', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({
      name: 'defaultShareImage',
      title: 'Default social share image',
      type: 'image',
      group: 'seo',
      options: { hotspot: true },
      description: 'Used when a page has no share image of its own. Recommended 1200 x 630.',
    }),
    defineField({ name: 'gtmId', title: 'Google Tag Manager ID', type: 'string', group: 'seo', description: 'For example GTM-XXXXXX.' }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
})
