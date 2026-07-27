import { urlFor } from '@/sanity/lib/image'
import { CtaBand } from './blocks/CtaBand'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Category archive: the blog masthead over the posts filed under one category. */
export function CategoryTemplate({ category, posts, settings }: { category: any; posts: any[]; settings: any }) {
  return (
    <>
      <section className="section post-masthead bg-black">
        <div className="container">
          {settings?.blogEyebrow ? <p className="eyebrow post-masthead-eyebrow">{settings.blogEyebrow}</p> : null}
          <h1 className="post-masthead-name">
            <a href="/blog">{settings?.blogName || 'Laney Said'}</a>
          </h1>
          <p className="category-label">{category.title}</p>
        </div>
      </section>

      <section className="section bg-black" data-pt="none">
        <div className="container">
          {posts.length ? (
            <div className="post-grid">
              {posts.map((p) => {
                const img = p.featuredImage?.asset
                  ? urlFor(p.featuredImage).width(880).height(618).fit('crop').url()
                  : undefined
                return (
                  <a key={p._id} className="post-card" href={`/${p.slug}`}>
                    {img ? <img src={img} alt={p.featuredImage?.alt || ''} loading="lazy" /> : <span className="post-card-placeholder" aria-hidden="true" />}
                    <div className="post-card-text">
                      <h3>{p.title}</h3>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <p className="category-empty">No posts in this category yet.</p>
          )}
        </div>
      </section>

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
