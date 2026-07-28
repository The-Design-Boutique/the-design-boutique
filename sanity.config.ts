'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool, defineLocations } from 'sanity/presentation'
import { visionTool } from '@sanity/vision'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schema, SINGLETONS } from './sanity/schemaTypes'
import { structure, defaultDocumentNode } from './sanity/structure'
import { CwvDashboard } from './sanity/tools/CwvDashboard'
import { NotFoundMonitor } from './sanity/tools/NotFoundMonitor'
import { withRedirectPrompt } from './sanity/actions/publishWithRedirect'

const singletonSet: readonly string[] = SINGLETONS

/** Document types that have a public address worth preserving when it changes. */
const REDIRECTABLE_TYPES: readonly string[] = ['page', 'post', 'client', 'goldEvent']

/**
 * Where each kind of document appears on the site, so Preview knows what to
 * open. These mirror the routes in app/(site)/[...slug]/page.tsx; if a route
 * moves, it has to move here too, and the Preview pane saying "no location"
 * is the symptom of forgetting.
 *
 * Only the four types that have their own public page are listed. Site
 * Settings, forms, redirects and the audit records have nothing to preview,
 * and offering them a Preview tab that never works would be worse than not
 * offering one at all.
 */
const previewLocations = {
  page: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [
        {
          title: doc?.title || 'Untitled',
          // The home page is stored with the slug "home" but lives at the root.
          href: doc?.slug === 'home' ? '/' : `/${doc?.slug}`,
        },
      ],
    }),
  }),
  post: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [{ title: doc?.title || 'Untitled', href: `/${doc?.slug}` }],
    }),
  }),
  client: defineLocations({
    select: { title: 'name', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [{ title: doc?.title || 'Untitled', href: `/portfolio/${doc?.slug}` }],
    }),
  }),
  goldEvent: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [{ title: doc?.title || 'Untitled', href: `/gold/${doc?.slug}` }],
    }),
  }),
}

export default defineConfig({
  basePath: '/studio',
  title: 'The Design Boutique',
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    // Adds a Preview tab beside the fields, and a Preview tool in the sidebar,
    // showing the page as it will look with the current unpublished edits.
    presentationTool({
      name: 'preview',
      title: 'Preview',
      previewUrl: {
        // Relative, because the Studio is served by the same site it previews.
        // Hardcoding a domain here would break the moment this is deployed
        // anywhere else, including at go-live.
        previewMode: { enable: '/api/draft/enable' },
      },
      resolve: { locations: previewLocations },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  // The Core Web Vitals dashboard is the first thing the team sees on login.
  tools: (prev) => [
    {
      name: 'core-web-vitals',
      title: 'Site Speed',
      component: CwvDashboard,
    },
    {
      name: 'dead-links',
      title: 'Dead Links',
      component: NotFoundMonitor,
    },
    ...prev,
  ],
  document: {
    // Singletons cannot be created from the global "new document" menu...
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((item) => !singletonSet.includes(item.templateId))
        : prev,
    // ...and cannot be duplicated, deleted, or unpublished.
    actions: (prev, { schemaType }) => {
      if (singletonSet.includes(schemaType)) {
        return prev.filter(({ action }) => action !== 'duplicate' && action !== 'delete' && action !== 'unpublish')
      }
      // Changing the address of a live page offers to leave a 301 behind
      // (ruleset 05, rule 12).
      if (!REDIRECTABLE_TYPES.includes(schemaType)) return prev
      return prev.map((action) => (action.action === 'publish' ? withRedirectPrompt(action) : action))
    },
  },
})
