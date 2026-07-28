import { defineField, defineType } from 'sanity'
import { SeoTitleInput, MetaDescriptionInput } from '../../components/seoInputs'
import { SchemaTypeInput } from '../../components/SchemaTypeInput'

/**
 * The single, shared SEO field stack (SOW 2.4). Every page-type document
 * includes this as its `seo` field. Do not redefine these fields per type.
 * The URL slug lives on the document itself (routing), not in this object.
 */
export const seoFields = defineType({
  name: 'seoFields',
  title: 'SEO',
  type: 'object',
  // Not collapsible: under the document's SEO tab the fields show directly, no extra expand.
  options: { collapsible: false },
  fieldsets: [
    // Social is open by default; only the power-user "Advanced" fields are tucked away.
    { name: 'social', title: 'Social sharing', options: { collapsible: true, collapsed: false } },
    { name: 'advanced', title: 'Advanced', options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'SEO title',
      type: 'string',
      description: 'Shown in search results and browser tabs. Falls back to the page title if left empty.',
      components: { input: SeoTitleInput },
      validation: (Rule) => Rule.max(60).warning('Longer than about 60 characters may be cut off in search results.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The summary shown under the title in search results.',
      components: { input: MetaDescriptionInput },
      validation: (Rule) => Rule.min(50).warning('Shorter than 50 characters is usually too brief to be useful.').max(160).warning('Longer than about 160 characters may be cut off.'),
    }),
    defineField({
      name: 'focusKeyword',
      title: 'Focus keyword',
      type: 'string',
      description:
        'The one search term you want this page to win, for example "brand design san francisco". ' +
        'This is a target for you, not something sent to Google. It is never added to the page and ' +
        'search engines never see it, so filling it in does not affect your ranking on its own. ' +
        '(Google stopped reading keyword tags in 2009.) What it does is switch on the keyword checks ' +
        'in the SEO tab: whether your phrase appears in the title, in the opening of the page, in the ' +
        'meta description, in a section heading, and often enough in the body. Those things are real ' +
        'SEO. The keyword is simply what they get measured against. Leaving it empty skips those ' +
        'checks rather than counting them against the page, but setting one is still worth doing: ' +
        'deciding what a page is actually about is most of the work.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      fieldset: 'advanced',
      description:
        'Which address search engines should treat as the real home of this content, for when the ' +
        'same content can be reached at more than one address. Leave it empty on almost every page. ' +
        'Empty means "this page is the original", which is correct nearly always, and the site fills ' +
        'in the page\'s own address for you automatically. Fill it in only when this content genuinely ' +
        'lives somewhere else and this copy should not compete with it: an article republished from ' +
        'another site, or the same page reachable at two addresses where you want one of them to be ' +
        'the winner. Take care with this one. Pointing it at the wrong address tells Google to rank ' +
        'that page instead of this one, and can remove this page from search results altogether. ' +
        'If you are unsure, leave it empty.',
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
      description: 'Tells search engines what kind of thing this page is. A preview of exactly what gets sent is shown below.',
      components: { input: SchemaTypeInput },
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
      name: 'faqs',
      title: 'Questions and answers',
      type: 'array',
      fieldset: 'advanced',
      description: 'Only used when the structured data type is set to FAQ page. Each question can then show directly in Google results.',
      hidden: ({ parent }) => parent?.schemaType !== 'FAQPage',
      of: [
        {
          type: 'object',
          name: 'faq',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (Rule) => Rule.required() }),
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        },
      ],
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
