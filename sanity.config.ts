'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schema, SINGLETONS } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

const singletonSet: readonly string[] = SINGLETONS

export default defineConfig({
  basePath: '/studio',
  title: 'The Design Boutique',
  projectId,
  dataset,
  schema,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  document: {
    // Singletons cannot be created from the global "new document" menu...
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((item) => !singletonSet.includes(item.templateId))
        : prev,
    // ...and cannot be duplicated, deleted, or unpublished.
    actions: (prev, { schemaType }) =>
      singletonSet.includes(schemaType)
        ? prev.filter(({ action }) => action !== 'duplicate' && action !== 'delete' && action !== 'unpublish')
        : prev,
  },
})
