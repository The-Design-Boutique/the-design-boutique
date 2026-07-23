import type { StructureResolver } from 'sanity/structure'

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

      S.divider(),

      S.listItem()
        .title('Navigation')
        .icon(() => '🧭')
        .child(S.document().schemaType('navigation').documentId('navigation').title('Navigation')),
      S.listItem()
        .title('Site Settings')
        .icon(() => '⚙️')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site Settings')),
    ])
