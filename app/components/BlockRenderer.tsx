import type { ComponentType } from 'react'
import { HeroHome } from './blocks/HeroHome'
import { SubpageBanner } from './blocks/SubpageBanner'
import { RichTextBlock } from './blocks/RichTextBlock'
import { ServicesGrid } from './blocks/ServicesGrid'
import { IconGrid } from './blocks/IconGrid'
import { CtaBand } from './blocks/CtaBand'
import { StatsCounters } from './blocks/StatsCounters'
import { FaqAccordion } from './blocks/FaqAccordion'
import { LogoWall } from './blocks/LogoWall'
import { VideoEmbed } from './blocks/VideoEmbed'
import { TestimonialSingle } from './blocks/TestimonialSingle'
import { ContactForm } from './blocks/ContactForm'
import { HtmlEmbed } from './blocks/HtmlEmbed'

/* eslint-disable @typescript-eslint/no-explicit-any */
// Blocks not yet rendered (built in the next Phase 2 increment) render nothing
// rather than erroring: solutionsRow, portfolioMosaic, portfolioLoop, clientInfo,
// clientSolution, testimonialCarousel, imageGallery, flipBoxGrid, newsletterSignup.
const registry: Record<string, ComponentType<{ block: any }>> = {
  heroHome: HeroHome,
  subpageBanner: SubpageBanner,
  richText: RichTextBlock,
  servicesGrid: ServicesGrid,
  iconGrid: IconGrid,
  ctaBand: CtaBand,
  statsCounters: StatsCounters,
  faqAccordion: FaqAccordion,
  logoWall: LogoWall,
  videoEmbed: VideoEmbed,
  testimonialSingle: TestimonialSingle,
  contactForm: ContactForm,
  htmlEmbed: HtmlEmbed,
}

export function BlockRenderer({ blocks }: { blocks?: any[] }) {
  if (!Array.isArray(blocks)) return null
  return (
    <>
      {blocks.map((block, i) => {
        const Component = registry[block?._type]
        return Component ? <Component key={block._key || i} block={block} /> : null
      })}
    </>
  )
}
