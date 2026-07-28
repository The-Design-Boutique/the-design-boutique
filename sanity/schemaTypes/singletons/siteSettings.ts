import { defineArrayMember, defineField, defineType } from 'sanity'
import { AiKeyInput, AiModelInput } from '../../components/AiAssistInputs'

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
    { name: 'blog', title: 'Blog' },
    { name: 'ai', title: 'Writing assistant' },
  ],
  fields: [
    defineField({ name: 'siteName', title: 'Site name', type: 'string', group: 'general', initialValue: 'The Design Boutique' }),
    defineField({ name: 'logo', title: 'Logo', type: 'imageWithAlt', group: 'general' }),
    defineField({ name: 'logoSecondary', title: 'Secondary logo', type: 'imageWithAlt', group: 'general', description: 'Shown beside the primary logo in the header (the "TDB Digital" mark).' }),
    defineField({ name: 'footerLogo', title: 'Footer logo', type: 'imageWithAlt', group: 'general', description: 'The compact square mark used in the footer.' }),
    defineField({ name: 'googleBadgeUrl', title: 'Google reviews badge URL', type: 'url', group: 'general', description: 'SVG badge shown in the footer social row.' }),
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
    // The promo card shown in the sidebar of every blog post.
    defineField({ name: 'blogEyebrow', title: 'Blog eyebrow', type: 'string', group: 'blog', initialValue: 'The Design Boutique', description: 'Small line above the blog name on post pages.' }),
    defineField({ name: 'blogName', title: 'Blog name', type: 'string', group: 'blog', initialValue: 'Laney Said' }),
    defineField({ name: 'postSidebarHeading', title: 'Post sidebar heading', type: 'text', rows: 2, group: 'blog', description: 'Shown at the top of the promo card on every post. Line breaks are kept.' }),
    defineField({ name: 'postSidebarItems', title: 'Post sidebar items', type: 'array', of: [{ type: 'text', rows: 2 }], group: 'blog', description: 'One line per service, e.g. "SEO: Drive Explosive Traffic & Real Results."' }),
    defineField({ name: 'postSidebarCta', title: 'Post sidebar button', type: 'link', group: 'blog' }),
    defineField({ name: 'relatedHeading', title: 'Related posts heading', type: 'string', group: 'blog', initialValue: 'More from The Design Boutique Blog' }),
    // Optional AI writing assistance. The SEO checks and readability panel are
    // always on and cost nothing; everything in this group is additive, off by
    // default, and billed to whichever account the key belongs to.
    defineField({
      name: 'aiAssist',
      title: 'Writing assistant',
      type: 'object',
      group: 'ai',
      description:
        'Adds an optional "Suggest" button to the SEO panel that can draft a meta description or tighten a paragraph. The SEO score and readability checks do not use this and keep working whether it is on or off.',
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'enabled',
          title: 'Turn the Suggest button on',
          type: 'boolean',
          initialValue: false,
          description: 'Off by default. Nothing is ever sent to a provider, and nothing is billed, until this is on and a key is saved.',
        }),
        defineField({
          name: 'provider',
          title: 'Provider',
          type: 'string',
          initialValue: 'anthropic',
          description: 'Use whichever account you already have. The two are interchangeable here.',
          options: {
            list: [
              { title: 'Anthropic (Claude)', value: 'anthropic' },
              { title: 'OpenAI', value: 'openai' },
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'model',
          title: 'Model',
          type: 'string',
          initialValue: 'claude-opus-5',
          components: { input: AiModelInput },
        }),
        defineField({
          name: 'key',
          title: 'API key',
          type: 'object',
          components: { input: AiKeyInput },
          description: 'Stored encrypted. Only the first few characters are ever shown again.',
          fields: [
            // Written by the key field's own controls, never typed into directly.
            defineField({ name: 'ciphertext', title: 'Encrypted key', type: 'string', readOnly: true, hidden: true }),
            defineField({ name: 'hint', title: 'Masked key', type: 'string', readOnly: true, hidden: true }),
            defineField({ name: 'updatedAt', title: 'Last updated', type: 'datetime', readOnly: true, hidden: true }),
          ],
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
})
