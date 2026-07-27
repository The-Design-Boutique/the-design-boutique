import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { CtaBand } from './blocks/CtaBand'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** "March 1, 2024" — the format the live site uses for post dates. */
function formatDate(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** Accepts watch / youtu.be / vimeo URLs and returns an embeddable src. */
function toEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return `https://www.youtube.com${u.pathname}`
      if (u.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}`
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}`
    return url
  } catch {
    return null
  }
}

const bodyComponents: PortableTextComponents = {
  types: {
    imageWithAlt: ({ value }: any) =>
      value?.asset ? <img className="post-body-img" src={urlFor(value).width(1200).url()} alt={value.alt || ''} loading="lazy" /> : null,
    image: ({ value }: any) =>
      value?.asset ? <img className="post-body-img" src={urlFor(value).width(1200).url()} alt={value.alt || ''} loading="lazy" /> : null,
    bodyVideo: ({ value }: any) => {
      const src = value?.url ? toEmbed(value.url) : null
      if (!src) return null
      return (
        <figure className="post-body-video">
          <iframe
            src={src}
            title={value.caption || 'Video'}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {value.caption ? <figcaption>{value.caption}</figcaption> : null}
        </figure>
      )
    },
  },
}

function PostSidebar({ settings }: { settings: any }) {
  const items: string[] = Array.isArray(settings?.postSidebarItems) ? settings.postSidebarItems : []
  const heading: string = settings?.postSidebarHeading || ''
  const cta = settings?.postSidebarCta
  if (!heading && !items.length) return null
  return (
    <aside className="post-sidebar">
      <div className="post-promo">
        {heading ? (
          <h3 className="post-promo-title">
            {heading.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </h3>
        ) : null}
        {items.length ? (
          <div className="post-promo-body">
            {items.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : null}
        {cta?.href ? (
          <a className="btn post-promo-btn" href={cta.href}>
            <span>{cta.label || "Let's Connect"}</span>
            <span className="btn-plus">+</span>
          </a>
        ) : null}
      </div>
    </aside>
  )
}

function ShareRow({ title, slug }: { title: string; slug: string }) {
  const url = `https://thedesignboutique.com/${slug}/`
  const enc = encodeURIComponent(url)
  const links = [
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, path: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z' },
    { name: 'Twitter', href: `https://twitter.com/intent/tweet?url=${enc}&text=${encodeURIComponent(title)}`, path: 'M23.95 4.57a10 10 0 01-2.82.77 4.96 4.96 0 002.16-2.72c-.95.56-2 .96-3.13 1.19a4.92 4.92 0 00-8.38 4.48A13.94 13.94 0 011.64 3.16a4.92 4.92 0 001.52 6.57 4.9 4.9 0 01-2.23-.62v.06a4.92 4.92 0 003.95 4.83 4.96 4.96 0 01-2.22.08 4.93 4.93 0 004.6 3.42A9.87 9.87 0 010 19.54 13.9 13.9 0 007.55 21.7c9.05 0 14-7.5 14-14 0-.21 0-.42-.02-.63a10 10 0 002.42-2.5z' },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`, path: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 013.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0z' },
  ]
  return (
    <div className="post-share">
      <h5 className="post-share-label">Share:</h5>
      <div className="post-share-icons">
        {links.map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noreferrer" aria-label={`Share on ${l.name}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d={l.path} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}

function RelatedCard({ post }: { post: any }) {
  const img = post.featuredImage?.asset ? urlFor(post.featuredImage).width(800).height(423).fit('crop').url() : undefined
  return (
    <a className="related-card" href={`/${post.slug}`}>
      {img ? <img src={img} alt={post.featuredImage?.alt || ''} loading="lazy" /> : <span className="related-card-placeholder" aria-hidden="true" />}
      <div className="related-card-text">
        <h3>{post.title}</h3>
      </div>
    </a>
  )
}

export function PostTemplate({ post, settings }: { post: any; settings: any }) {
  const date = formatDate(post.publishedAt)
  const related: any[] = Array.isArray(post.related) ? post.related : []
  return (
    <>
      {/* Mini masthead: the blog's own name, linking back to the index. */}
      <section className="section post-masthead bg-black">
        <div className="container">
          {settings?.blogEyebrow ? <p className="eyebrow post-masthead-eyebrow">{settings.blogEyebrow}</p> : null}
          <h2 className="post-masthead-name">
            <a href="/blog">{settings?.blogName || 'Laney Said'}</a>
          </h2>
        </div>
      </section>

      <section className="section post-main bg-black">
        <div className="container">
          <div className="post-layout">
            <article className="post-content">
              <h1 className="post-title">{post.title}</h1>
              <p className="post-meta">
                <span className="post-meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" /></svg>
                  {post.authorName}
                </span>
                {date ? (
                  <span className="post-meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2v2H4v18h16V4h-3V2h-2v2H9V2H7zm-1 8h12v10H6V10z" /></svg>
                    {date}
                  </span>
                ) : null}
              </p>
              <div className="prose post-body">
                <PortableText value={post.body || []} components={bodyComponents} />
              </div>
              <ShareRow title={post.title} slug={post.slug} />
            </article>
            <PostSidebar settings={settings} />
          </div>
        </div>
      </section>

      {(post.previous || post.next) && (
        <section className="section post-nav-section bg-black" data-pt="none">
          <div className="container">
            <nav className="post-nav">
              {post.previous ? (
                <a className="post-nav-prev" href={`/${post.previous.slug}`}>
                  <span aria-hidden="true">&#8249;</span> {post.previous.title}
                </a>
              ) : <span />}
              {post.next ? (
                <a className="post-nav-next" href={`/${post.next.slug}`}>
                  {post.next.title} <span aria-hidden="true">&#8250;</span>
                </a>
              ) : <span />}
            </nav>
          </div>
        </section>
      )}

      {related.length ? (
        <section className="section post-related bg-black">
          <div className="container">
            <h4 className="post-related-heading">{settings?.relatedHeading || 'More from The Design Boutique Blog'}</h4>
            <div className="related-grid">
              {related.map((r) => <RelatedCard key={r._id} post={r} />)}
            </div>
          </div>
        </section>
      ) : null}

      <CtaBand
        block={{
          headline: 'It’s time to unlock your growth.\nLet’s Go!',
          underlineLastLine: true,
          settings: { background: 'forest' },
        }}
      />
    </>
  )
}
