import type { ReactNode } from 'react'
import { HeroHome } from './blocks/HeroHome'
import { SubpageBanner } from './blocks/SubpageBanner'
import { AboutSection } from './blocks/AboutSection'
import { IndustriesSection } from './blocks/IndustriesSection'
import { WorkShowcase } from './blocks/WorkShowcase'
import { RichTextBlock } from './blocks/RichTextBlock'
import { ServicesGrid } from './blocks/ServicesGrid'
import { IconGrid } from './blocks/IconGrid'
import { SolutionsRow } from './blocks/SolutionsRow'
import { CtaBand } from './blocks/CtaBand'
import { StatsCounters } from './blocks/StatsCounters'
import { FaqAccordion } from './blocks/FaqAccordion'
import { LogoWall } from './blocks/LogoWall'
import { VideoEmbed } from './blocks/VideoEmbed'
import { TestimonialSingle } from './blocks/TestimonialSingle'
import { TestimonialCarousel } from './blocks/TestimonialCarousel'
import { PortfolioMosaic } from './blocks/PortfolioMosaic'
import { PortfolioLoop } from './blocks/PortfolioLoop'
import { ClientInfo } from './blocks/ClientInfo'
import { ClientSolution } from './blocks/ClientSolution'
import { ImageGallery } from './blocks/ImageGallery'
import { FlipBoxGrid } from './blocks/FlipBoxGrid'
import { TeamGrid } from './blocks/TeamGrid'
import { VideoGrid } from './blocks/VideoGrid'
import { ValuesGrid } from './blocks/ValuesGrid'
import { ContactForm } from './blocks/ContactForm'
import { NewsletterSignup } from './blocks/NewsletterSignup'
import { HtmlEmbed } from './blocks/HtmlEmbed'

/* eslint-disable @typescript-eslint/no-explicit-any */
type BlockComponent = (props: { block: any }) => ReactNode | Promise<ReactNode>

const registry: Record<string, BlockComponent> = {
  heroHome: HeroHome,
  subpageBanner: SubpageBanner,
  aboutSection: AboutSection,
  industriesSection: IndustriesSection,
  workShowcase: WorkShowcase,
  richText: RichTextBlock,
  servicesGrid: ServicesGrid,
  iconGrid: IconGrid,
  solutionsRow: SolutionsRow,
  ctaBand: CtaBand,
  statsCounters: StatsCounters,
  faqAccordion: FaqAccordion,
  logoWall: LogoWall,
  videoEmbed: VideoEmbed,
  testimonialSingle: TestimonialSingle,
  testimonialCarousel: TestimonialCarousel,
  portfolioMosaic: PortfolioMosaic,
  portfolioLoop: PortfolioLoop,
  clientInfo: ClientInfo,
  clientSolution: ClientSolution,
  imageGallery: ImageGallery,
  teamGrid: TeamGrid,
  videoGrid: VideoGrid,
  valuesGrid: ValuesGrid,
  flipBoxGrid: FlipBoxGrid,
  contactForm: ContactForm,
  newsletterSignup: NewsletterSignup,
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
