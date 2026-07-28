'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
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

export default defineConfig({
  basePath: '/studio',
  title: 'The Design Boutique',
  projectId,
  dataset,
  schema,
  plugins: [structureTool({ structure, defaultDocumentNode }), visionTool({ defaultApiVersion: apiVersion })],
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
