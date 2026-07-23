import type { ReactNode } from 'react'

export type SectionSettings = {
  background?: 'black' | 'dark' | 'white' | 'forest' | 'leaf' | 'leaves'
  paddingTop?: 'none' | 'small' | 'medium' | 'large'
  paddingBottom?: 'none' | 'small' | 'medium' | 'large'
  anchorId?: string
}

/** Full-bleed section wrapper that applies shared sectionSettings. */
export function Section({
  settings,
  children,
  container = 'default',
  className,
}: {
  settings?: SectionSettings
  children: ReactNode
  container?: 'default' | 'wide' | 'narrow' | 'none'
  className?: string
}) {
  const bg = settings?.background || 'black'
  const containerClass =
    container === 'wide'
      ? 'container container--wide'
      : container === 'narrow'
        ? 'container container--narrow'
        : 'container'
  return (
    <section
      id={settings?.anchorId || undefined}
      className={`section bg-${bg}${className ? ' ' + className : ''}`}
      data-pt={settings?.paddingTop && settings.paddingTop !== 'large' ? settings.paddingTop : undefined}
      data-pb={settings?.paddingBottom && settings.paddingBottom !== 'large' ? settings.paddingBottom : undefined}
    >
      {container === 'none' ? children : <div className={containerClass}>{children}</div>}
    </section>
  )
}
