import type { NextConfig } from 'next'

/**
 * URLs the live site redirects. Mirroring them keeps inbound links and any
 * historical references resolving on staging exactly as they do on live.
 * `content-marekting` is a typo on the live site that still resolves there.
 */
const liveRedirects = [
  { source: '/connect', destination: '/contact' },
  { source: '/vision-values', destination: '/about/vision-values' },
  { source: '/solutions/geo-ai-services', destination: '/solutions/geo-services' },
  { source: '/solutions/content-marekting-services', destination: '/solutions/content-marketing-services' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  async redirects() {
    return liveRedirects.map((r) => ({ ...r, permanent: true }))
  },
}

export default nextConfig
