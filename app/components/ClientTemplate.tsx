import { CtaBand } from './blocks/CtaBand'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A services line may name the program tier after a pipe
 * ("Digital Marketing | Bronzo"); the live site colours the tier.
 */
function ServiceLine({ line }: { line: string }) {
  const idx = line.indexOf('|')
  if (idx === -1) return <li>{line}</li>
  return (
    <li>
      {line.slice(0, idx + 1)}{' '}
      <a className="client-tier" href="/programs">{line.slice(idx + 1).trim()}</a>
    </li>
  )
}

export function ClientTemplate({ client }: { client: any }) {
  const services: string[] = Array.isArray(client.services) ? client.services : []
  const gallery: any[] = Array.isArray(client.gallery) ? client.gallery : []
  const cover = client.featuredImage?.asset ? urlFor(client.featuredImage).width(1400).url() : undefined
  return (
    <>
      <section className="section client-main bg-black">
        <div className="container">
          <div className="client-layout">
            <aside className="client-rail">
              {client.industry ? (
                <div className="client-rail-group">
                  <h6 className="client-rail-label">Industry</h6>
                  <p className="client-rail-value">{client.industry}</p>
                </div>
              ) : null}
              {services.length ? (
                <div className="client-rail-group">
                  <h6 className="client-rail-label">Services</h6>
                  <ul className="client-rail-list">
                    {services.map((s, i) => <ServiceLine key={i} line={s} />)}
                  </ul>
                </div>
              ) : null}
            </aside>

            <article className="client-content">
              <h1 className="client-title">{client.title}</h1>
              {client.intro ? <p className="client-intro">{client.intro}</p> : null}

              {cover ? (
                client.websiteUrl ? (
                  <a className="client-cover" href={client.websiteUrl} target="_blank" rel="noreferrer">
                    <img src={cover} alt={client.featuredImage?.alt || client.title} />
                    <span className="client-cover-hover">
                      <span className="client-cover-name">{client.title}</span>
                      <span className="client-cover-btn">Visit website</span>
                    </span>
                  </a>
                ) : (
                  <div className="client-cover">
                    <img src={cover} alt={client.featuredImage?.alt || client.title} />
                  </div>
                )
              ) : null}

              {gallery.length ? (
                <div className="client-gallery">
                  {gallery.map((g: any, i: number) => (
                    <img key={i} src={urlFor(g).width(900).url()} alt={g.alt || ''} loading="lazy" />
                  ))}
                </div>
              ) : null}
            </article>
          </div>
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
