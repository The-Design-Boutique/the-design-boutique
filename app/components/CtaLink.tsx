export type CtaData = { label?: string; href?: string; openInNewTab?: boolean }

/**
 * Renders a resolved link (see the `link` GROQ projection) as a button.
 * TDB buttons carry a trailing "+" affordance (Hire Us! +, Let's Chat! +, Read More +).
 */
export function CtaLink({ cta, variant = 'accent' }: { cta?: CtaData; variant?: 'accent' | 'outline' }) {
  if (!cta || (!cta.href && !cta.label)) return null
  const className = variant === 'outline' ? 'btn btn--outline' : 'btn'
  return (
    <a
      className={className}
      href={cta.href || '#'}
      target={cta.openInNewTab ? '_blank' : undefined}
      rel={cta.openInNewTab ? 'noopener noreferrer' : undefined}
    >
      <span>{cta.label || 'Learn more'}</span>
      <span className="btn-plus" aria-hidden="true">+</span>
    </a>
  )
}
