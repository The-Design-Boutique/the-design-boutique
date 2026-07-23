import type { StructureResolver } from 'sanity/structure'

/**
 * WordPress-familiar desk: content types first, then the pinned singletons,
 * ordered like the WP admin left nav. Emoji icons keep it approachable and
 * avoid the @sanity/icons bundling issue under Turbopack.
 * New content types (Laney Said, Clients, Gold Events, Testimonials) are added
 * here as they are built in Phase 1.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('page').title('Pages').icon(() => '📄'),

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
