import { defineQuery } from 'next-sanity'

// Resolves a `link` object to a usable href (external URL or internal slug path).
const linkProjection = `{
  label,
  "href": select(
    type == "external" => href,
    defined(internal) => "/" + internal->slug.current,
    true => href
  ),
  openInNewTab
}`

export const PAGE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    seo,
    pageBuilder[]{
      ...,
      ctas[]${linkProjection},
      services[]{ title, description, icon, link${linkProjection} },
      testimonial->{ name, roleCompany, quote, videoUrl, featured, image },
      testimonials[]->{ name, roleCompany, quote, image, videoUrl },
      clients[]->{ title, "slug": slug.current, logo }
    }
  }
`)

export const LAYOUT_QUERY = defineQuery(`{
  "nav": *[_id == "navigation"][0]{
    headerMenu[]{ label, link${linkProjection}, submenu[]{ label, link${linkProjection} } },
    headerCta{ label, link${linkProjection} },
    footerColumns[]{ title, links[]${linkProjection} }
  },
  "settings": *[_id == "siteSettings"][0]{ siteName, logo, email, phone }
}`)
