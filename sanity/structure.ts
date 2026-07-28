import type { DefaultDocumentNodeResolver, StructureResolver } from 'sanity/structure'
import { SeoPanel } from './components/SeoPanel'
import { SearchPanel } from './components/SearchPanel'
import { AeoPanel } from './components/AeoPanel'

/** Document types that are real, routable pages and so get the SEO panel. */
const ROUTABLE_TYPES = ['page', 'post', 'client', 'goldEvent']

/**
 * Adds an SEO tab beside the editor on every routable document (SOW 2.5
 * sections 1, 2 and 7). Everything in it is computed from the open document,
 * so it needs no network call and costs nothing to run.
 */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  if (!ROUTABLE_TYPES.includes(schemaType)) return S.document().views([S.view.form()])
  // Three tabs rather than two. The SEO tab is a checklist you work through
  // while writing and recomputes as you type; Search is a report on how the
  // published page is doing in Google, which changes once a day. Different
  // questions, different moments, and buried together the search figures were
  // easy to miss below a long list of checks.
  return S.document().views([
    S.view.form().title('Edit'),
    S.view.component(SeoPanel).title('SEO').id('seo'),
    S.view.component(SearchPanel).title('Search').id('search'),
    S.view.component(AeoPanel).title('AEO').id('aeo'),
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
      // The blog is branded "Laney Said" on the site itself. The parenthesis is
      // a label rather than part of the name, so that someone new to the Studio
      // can find the blog without already knowing what it is called.
      S.documentTypeListItem('post').title('Laney Said (Blog)').icon(() => '📝'),
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

      S.documentTypeListItem('form').title('Forms by Angelo').icon(() => '🧾'),
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
