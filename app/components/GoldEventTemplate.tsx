import { PortableText } from '@portabletext/react'
import { CtaBand } from './blocks/CtaBand'
import { bodyComponents, ShareRow, PostSidebar, formatDate } from './PostTemplate'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Card in the "More from Gold Events" row (mirrors the /gold index cards). */
function EventCard({ event }: { event: any }) {
  return (
    <article className="event-card">
      <h3 className="event-card-title">
        <a href={`/gold/${event.slug}`}>{event.title}</a>
      </h3>
      {event.date ? <p className="event-card-date">{formatDate(event.date)}</p> : null}
      <a className="event-card-more" href={`/gold/${event.slug}`}>
        Replay &rarr;
      </a>
    </article>
  )
}

export function GoldEventTemplate({ event, settings }: { event: any; settings: any }) {
  const date = formatDate(event.date)
  const related: any[] = Array.isArray(event.related) ? event.related : []
  return (
    <>
      <section className="section post-masthead bg-black">
        <div className="container">
          {settings?.blogEyebrow ? <p className="eyebrow post-masthead-eyebrow">{settings.blogEyebrow}</p> : null}
          <h2 className="post-masthead-name">
            <a href="/gold">Gold Event</a>
          </h2>
        </div>
      </section>

      <section className="section post-main bg-black">
        <div className="container">
          <div className="post-layout">
            <article className="post-content">
              <h1 className="post-title">{event.title}</h1>
              <p className="post-meta">
                {date ? (
                  <span className="post-meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2v2H4v18h16V4h-3V2h-2v2H9V2H7zm-1 8h12v10H6V10z" /></svg>
                    {date}
                  </span>
                ) : null}
              </p>
              {event.presenter ? <p className="gold-presenter">Presented By: {event.presenter}</p> : null}
              <div className="prose post-body">
                <PortableText value={event.description || []} components={bodyComponents} />
              </div>
              <ShareRow title={event.title} slug={`gold/${event.slug}`} />
            </article>
            <PostSidebar settings={settings} />
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="section post-related bg-black">
          <div className="container">
            <h4 className="post-related-heading">More from Gold Events</h4>
            <div className="gold-related-grid">
              {related.map((r) => <EventCard key={r._id} event={r} />)}
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
