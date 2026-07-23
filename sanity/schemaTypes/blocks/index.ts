import { heroHome } from './heroHome'
import { subpageBanner } from './subpageBanner'
import { aboutSection } from './aboutSection'
import { richText } from './richText'
import { ctaBand } from './ctaBand'
import { videoEmbed } from './videoEmbed'
import { htmlEmbed } from './htmlEmbed'
import { servicesGrid } from './servicesGrid'
import { iconGrid } from './iconGrid'
import { solutionsRow } from './solutionsRow'
import { logoWall } from './logoWall'
import { statsCounters } from './statsCounters'
import { faqAccordion } from './faqAccordion'
import { portfolioMosaic } from './portfolioMosaic'
import { portfolioLoop } from './portfolioLoop'
import { clientInfo } from './clientInfo'
import { clientSolution } from './clientSolution'
import { testimonialCarousel } from './testimonialCarousel'
import { testimonialSingle } from './testimonialSingle'
import { contactForm } from './contactForm'
import { newsletterSignup } from './newsletterSignup'
import { imageGallery } from './imageGallery'
import { flipBoxGrid } from './flipBoxGrid'

/** All page-builder blocks, in a sensible insert-menu order. */
export const blocks = [
  // hero / banners
  heroHome,
  subpageBanner,
  // content
  richText,
  aboutSection,
  servicesGrid,
  iconGrid,
  solutionsRow,
  statsCounters,
  faqAccordion,
  imageGallery,
  flipBoxGrid,
  logoWall,
  // portfolio / clients
  portfolioMosaic,
  portfolioLoop,
  clientInfo,
  clientSolution,
  // testimonials
  testimonialCarousel,
  testimonialSingle,
  // media / marketing
  videoEmbed,
  ctaBand,
  contactForm,
  newsletterSignup,
  // advanced
  htmlEmbed,
]

/** Array members for a document's `pageBuilder` field (`of: blockArrayMembers`). */
export const blockArrayMembers = blocks.map((b) => ({ type: b.name }))
