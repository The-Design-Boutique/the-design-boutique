import { defineField, defineType } from 'sanity'
import { SeoTitleInput, MetaDescriptionInput } from '../../components/seoInputs'

/**
 * The single, shared SEO field stack (SOW 2.4). Every page-type document
 * includes this as its `seo` field. Do not redefine these fields per type.
 * The URL slug lives on the document itself (routing), not in this object.
 */
export const seoFields = defineType({
  name: 'seoFields',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fieldsets: [
    { name: 'social', title: 'Social sharing', options: { collapsible: true, collapsed: true } },
    { name: 'advanced', title: 'Advanced', options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'SEO title',
      type: 'string',
      description: 'Shown in search results and browser tabs. Falls back to the page title if left empty.',
      components: { input: SeoTitleInput },
      validation: (Rule) => Rule.max(70).warning('Longer than ~70 characters may be truncated in search results.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The summary shown under the title in search results.',
      components: { input: MetaDescriptionInput },
      validation: (Rule) => Rule.max(180).warning('Longer than ~160 characters may be truncated.'),
    }),
    defineField({
      name: 'focusKeyword',
      title: 'Focus keyword',
      type: 'string',
      description: 'The main search term this page targets. Drives the on-page SEO checks.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      fieldset: 'advanced',
      description: 'Leave empty for this page to be its own canonical (the normal case).',
    }),
    defineField({
      name: 'robots',
      title: 'Search engine directives',
      type: 'object',
      fieldset: 'advanced',
      options: { columns: 2 },
      fields: [
        defineField({ name: 'index', title: 'Allow indexing', type: 'boolean', initialValue: true }),
        defineField({ name: 'follow', title: 'Follow links', type: 'boolean', initialValue: true }),
      ],
    }),
    defineField({
      name: 'schemaType',
      title: 'Structured data type',
      type: 'string',
      fieldset: 'advanced',
      initialValue: 'WebPage',
      options: {
        list: [
          { title: 'Web page (default)', value: 'WebPage' },
          { title: 'Organization', value: 'Organization' },
          { title: 'Service', value: 'Service' },
          { title: 'FAQ page', value: 'FAQPage' },
          { title: 'Article', value: 'Article' },
          { title: 'Local business', value: 'LocalBusiness' },
        ],
      },
    }),
    defineField({
      name: 'breadcrumbTitle',
      title: 'Breadcrumb label',
      type: 'string',
      fieldset: 'advanced',
      description: 'Short label used in breadcrumb trails. Falls back to the page title.',
    }),
    // Social sharing (Open Graph + Twitter/X). All fall back to the SEO/page values.
    defineField({ name: 'ogTitle', title: 'Share title', type: 'string', fieldset: 'social', description: 'Falls back to the SEO title, then the page title.' }),
    defineField({ name: 'ogDescription', title: 'Share description', type: 'text', rows: 2, fieldset: 'social', description: 'Falls back to the meta description.' }),
    defineField({ name: 'ogImage', title: 'Share image', type: 'image', fieldset: 'social', options: { hotspot: true }, description: 'Recommended 1200 x 630. Falls back to the site default share image.' }),
    defineField({
      name: 'twitterCardType',
      title: 'Twitter/X card type',
      type: 'string',
      fieldset: 'social',
      initialValue: 'summary_large_image',
      options: { list: ['summary_large_image', 'summary'], layout: 'radio' },
    }),
    defineField({ name: 'twitterTitle', title: 'Twitter/X title', type: 'string', fieldset: 'social', description: 'Falls back to the share title.' }),
    defineField({ name: 'twitterDescription', title: 'Twitter/X description', type: 'text', rows: 2, fieldset: 'social', description: 'Falls back to the share description.' }),
    defineField({ name: 'twitterImage', title: 'Twitter/X image', type: 'image', fieldset: 'social', options: { hotspot: true }, description: 'Falls back to the share image.' }),
  ],
})
