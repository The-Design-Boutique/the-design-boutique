import { type SchemaTypeDefinition } from 'sanity'

// Documents
import { page } from './documents/page'
import { post } from './documents/post'
import { client } from './documents/client'
import { goldEvent } from './documents/goldEvent'
import { cwvSnapshot } from './documents/cwvSnapshot'
import { testimonial } from './documents/testimonial'
import { author } from './documents/author'
import { category } from './documents/category'
import { clientCategory } from './documents/clientCategory'
import { formSubmission } from './documents/formSubmission'
import { redirect } from './documents/redirect'
import { notFoundEntry } from './documents/notFoundEntry'
import { form } from './documents/form'
import { seoAudit } from './documents/seoAudit'

// Singletons
import { siteSettings } from './singletons/siteSettings'
import { officeLocation } from './singletons/officeLocation'
import { navigation } from './singletons/navigation'

// Shared objects
import { seoFields } from './objects/seoFields'
import { link } from './objects/link'
import { sectionSettings } from './objects/sectionSettings'
import { imageWithAlt } from './objects/imageWithAlt'
import { bodyVideo } from './objects/bodyVideo'
import { bodyHtml } from './objects/bodyHtml'

// Page-builder blocks
import { blocks } from './blocks'

/** Document type names that are singletons (one instance, pinned in the desk). */
export const SINGLETONS = ['siteSettings', 'navigation', 'officeLocation'] as const

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // content documents
    page,
    post,
    client,
    goldEvent,
  cwvSnapshot,
    testimonial,
    // taxonomies
    author,
    category,
    clientCategory,
    // operational
    formSubmission,
    redirect,
    notFoundEntry,
    form,
    seoAudit,
    // singletons
    siteSettings,
  officeLocation,
    navigation,
    // shared objects
    seoFields,
    link,
    sectionSettings,
    imageWithAlt,
  bodyVideo,
  bodyHtml,
    // page-builder blocks
    ...blocks,
  ],
}
