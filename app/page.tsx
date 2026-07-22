export default function Home() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div>
        <p
          style={{
            color: 'var(--tdb-accent)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            fontWeight: 700,
            margin: 0,
          }}
        >
          The Design Boutique
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', margin: '0.75rem 0' }}>
          Staging build
        </h1>
        <p style={{ color: 'var(--tdb-offwhite)', margin: 0 }}>
          Rebuild in progress. Content Studio at{' '}
          <a href="/studio">/studio</a>.
        </p>
      </div>
    </main>
  )
}
