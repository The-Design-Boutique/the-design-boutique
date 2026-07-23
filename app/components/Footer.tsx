/* eslint-disable @typescript-eslint/no-explicit-any */
export function Footer({ nav, settings }: { nav?: any; settings?: any }) {
  const columns: any[] = Array.isArray(nav?.footerColumns) ? nav.footerColumns : []
  const year = new Date().getFullYear()
  const siteName = settings?.siteName || 'The Design Boutique'

  return (
    <footer className="bg-dark" style={{ borderTop: '1px solid #2b2b2b', paddingBlock: '3rem' }}>
      <div className="container">
        {columns.length ? (
          <div className="grid grid--4" style={{ marginBottom: '2rem' }}>
            {columns.map((col, i) => (
              <div key={i}>
                {col.title ? <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tdb-offwhite)', marginBottom: '0.75rem' }}>{col.title}</h3> : null}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                  {(Array.isArray(col.links) ? col.links : []).map((l: any, j: number) => (
                    <li key={j}><a href={l.href || '#'} style={{ color: 'var(--tdb-white)' }}>{l.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        <p style={{ color: 'var(--tdb-offwhite)', fontSize: '0.85rem', margin: 0 }}>
          &copy; {year} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
