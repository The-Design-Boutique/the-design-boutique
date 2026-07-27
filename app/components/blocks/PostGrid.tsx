import { Section } from '../Section'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function PostGrid({ block }: { block: any }) {
  const all: any[] = Array.isArray(block.posts) ? block.posts : []
  const posts = block.limit ? all.slice(0, block.limit) : all
  if (!posts.length) return null
  return (
    <Section settings={block.settings}>
      {block.heading ? <div className="section-heading section-heading--wide"><h2 className="h2">{block.heading}</h2></div> : null}
      <div className="post-grid">
        {posts.map((p) => {
          const img = p.featuredImage?.asset ? urlFor(p.featuredImage).width(880).height(618).fit('crop').url() : undefined
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
    </Section>
  )
}
