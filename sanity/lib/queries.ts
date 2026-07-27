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
      cta${linkProjection},
      cardsLink${linkProjection},
      services[]{ title, description, icon, iconImage, hoverImage, link${linkProjection}, cta${linkProjection} },
      testimonial->{ name, roleCompany, quote, videoUrl, featured, image },
      testimonials[]->{ name, roleCompany, quote, image, videoUrl },
      clients[]->{ title, "slug": slug.current, logo },
      _type == "postGrid" => {
        "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc){
          _id, title, "slug": slug.current, publishedAt, featuredImage
        }
      }
    }
  }
`)

// Blog posts live at the site root (e.g. /5-mistakes) to match the live site.
const postCardProjection = `{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  featuredImage
}`

export const POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    featuredImage,
    body[]{ ... },
    seo,
    "authorName": coalesce(author->name, "Laney Silverman"),
    "previous": *[_type == "post" && publishedAt < ^.publishedAt] | order(publishedAt desc)[0]{ title, "slug": slug.current },
    "next": *[_type == "post" && publishedAt > ^.publishedAt] | order(publishedAt asc)[0]{ title, "slug": slug.current },
    "related": *[_type == "post" && _id != ^._id] | order(publishedAt desc)[0...3]${postCardProjection}
  }
`)

export const POST_LIST_QUERY = defineQuery(`
  *[_type == "post"] | order(publishedAt desc)${postCardProjection}
`)

export const POST_SLUGS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)].slug.current`)

export const GOLD_EVENT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "goldEvent" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    date,
    presenter,
    videoUrl,
    description[]{ ... },
    seo,
    "related": *[_type == "goldEvent" && _id != ^._id] | order(date desc)[0...3]{
      _id, title, "slug": slug.current, date
    }
  }
`)

export const CLIENT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "client" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    intro,
    industry,
    services,
    websiteUrl,
    featuredImage,
    gallery[]{ ..., asset },
    body[]{ ... },
    seo
  }
`)

export const CATEGORY_BY_SLUG_QUERY = defineQuery(`
  *[_type == "category" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    description,
    seo,
    "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc){
      _id, title, "slug": slug.current, publishedAt, featuredImage
    }
  }
`)

export const BLOG_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    blogEyebrow,
    blogName,
    postSidebarHeading,
    postSidebarItems,
    postSidebarCta${linkProjection},
    relatedHeading,
    socialLinks[]{ platform, url }
  }
`)

export const SITE_DEFAULTS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{ siteName, email, phone, address, defaultShareImage }
`)

export const LAYOUT_QUERY = defineQuery(`{
  "nav": *[_id == "navigation"][0]{
    headerMenu[]{ label, link${linkProjection}, submenu[]{ label, link${linkProjection} } },
    headerCta{ label, link${linkProjection} },
    footerColumns[]{ title, links[]${linkProjection} }
  },
  "settings": *[_id == "siteSettings"][0]{ siteName, logo, logoSecondary, footerLogo, googleBadgeUrl, email, phone, address, defaultShareImage, socialLinks[]{ platform, url } }
}`)
