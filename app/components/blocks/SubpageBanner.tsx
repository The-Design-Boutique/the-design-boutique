import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SubpageBanner({ block }: { block: any }) {
  const bg = block.backgroundImage?.asset ? urlFor(block.backgroundImage).width(1920).quality(80).url() : undefined
  const style = bg
    ? { backgroundImage: `linear-gradient(rgba(7,7,7,0.55), rgba(7,7,7,0.85)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined
  return (
    <section className="section bg-black" style={style} data-pt="medium" data-pb="medium">
      <div className="container" style={{ textAlign: 'center' }}>
        {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
        <h1 className="h1">{block.title}</h1>
        {block.subtitle ? <p className="lead" style={{ margin: '1rem auto 0' }}>{block.subtitle}</p> : null}
      </div>
    </section>
  )
}
