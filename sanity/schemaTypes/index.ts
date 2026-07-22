import { type SchemaTypeDefinition } from 'sanity'

// Content model is built in Phase 1. This scaffold starts with an empty schema
// so the Studio plumbing can be verified end to end first.
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [],
}
