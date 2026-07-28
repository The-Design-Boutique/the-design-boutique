import type { DefaultDocumentNodeResolver, StructureResolver } from 'sanity/structure'
import { SeoPanel } from './components/SeoPanel'

/** Document types that are real, routable pages and so get the SEO panel. */
const ROUTABLE_TYPES = ['page', 'post', 'client', 'goldEvent']

/**
 * Adds an SEO tab beside the editor on every routable document (SOW 2.5
 * sections 1, 2 and 7). Everything in it is computed from the open document,
 * so it needs no network call and costs nothing to run.
 */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  if (!ROUTABLE_TYPES.includes(schemaType)) return S.document().views([S.view.form()])
  return S.document().views([
    S.view.form().title('Edit'),
    S.view.component(SeoPanel).title('SEO').id('seo'),
  ])
}

/**
 * WordPress-familiar desk: content types up top (like WP's Pages/Posts/CPTs),
 * taxonomies grouped together, and the pinned settings singletons at the bottom.
 * Emoji icons keep it approachable and avoid the @sanity/icons bundling issue.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('page').title('Pages').icon(() => '📄'),
      S.documentTypeListItem('post').title('Laney Said').icon(() => '📝'),
      S.documentTypeListItem('client').title('Clients').icon(() => '💼'),
      S.documentTypeListItem('goldEvent').title('Gold Events').icon(() => '🥇'),
      S.documentTypeListItem('testimonial').title('Testimonials').icon(() => '💬'),

      S.divider(),

      S.listItem()
        .title('Taxonomies')
        .icon(() => '🏷️')
        .child(
          S.list()
            .title('Taxonomies')
            .items([
              S.documentTypeListItem('category').title('Blog Categories'),
              S.documentTypeListItem('clientCategory').title('Client Categories'),
              S.documentTypeListItem('author').title('Authors'),
            ]),
        ),

      S.documentTypeListItem('formSubmission').title('Form Submissions').icon(() => '📥'),
      S.documentTypeListItem('redirect').title('Redirects').icon(() => '↪️'),

      S.divider(),

      S.listItem()
        .title('Navigation')
        .icon(() => '🧭')
        .child(S.document().schemaType('navigation').documentId('navigation').title('Navigation')),
      S.listItem()
        .title('Site Settings')
        .icon(() => '⚙️')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site Settings')),
      S.listItem()
        .title('Office & Local SEO')
        .icon(() => '📍')
        .child(S.document().schemaType('officeLocation').documentId('officeLocation').title('Office & Local SEO')),
    ])
