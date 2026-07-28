'use client'

import { useEffect, useState } from 'react'
import { Badge, Box, Card, Container, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui'

/**
 * The three files search engines and AI assistants read before they read a page.
 *
 * Read only, deliberately. robots.txt in particular can remove an entire site
 * from Google with one wrong line, and it is generated from the same setting
 * that controls the site-wide noindex, so the two can never disagree. An edit
 * box here would be a way to make them disagree.
 *
 * What this screen is for is answering the questions people actually have about
 * these files: what is in them, whether they are working, and what they mean.
 * Every one of them is invisible on the site itself, so without something like
 * this the only way to check is to know the addresses and read raw XML.
 */

interface SectionInfo {
  key: string
  file: string
  title: string
  description: string
  count: number
  /** What the file advertises: the live domain. */
  url: string
  /** Where it can actually be read today: this deployment. */
  viewUrl: string
}

/**
 * A link that opens the real file in a new tab.
 *
 * Always points at this deployment, never at the live domain. The live
 * thedesignboutique.com is still WordPress and serves its own robots.txt and
 * sitemap, so a link there would quietly show the old site's files and look like
 * ours were wrong.
 */
function OpenFile({ href, label = 'Open the file' }: { href: string; label?: string }) {
  return (
    <Text size={0}>
      <a href={href} target="_blank" rel="noreferrer">
        {label} ↗
      </a>
    </Text>
  )
}

interface SiteFiles {
  site: string
  origin: string
  robots: {
    text: string | null
    staging: boolean
    answerEngines: string[]
    trainingCrawlers: string[]
    privatePaths: string[]
  }
  llms: { text: string | null; lines: number }
  sitemap: { indexUrl: string; indexViewUrl: string; sections: SectionInfo[]; total: number }
  view: { robots: string; llms: string; sitemap: string }
}

/** A file shown as it actually is, in a monospaced block that can be scrolled. */
function FileBlock({ text, maxHeight = 260 }: { text: string | null; maxHeight?: number }) {
  if (!text) {
    return (
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>
          This file could not be read from here. That is expected when the Studio is running on its
          own; open it on the deployed site instead.
        </Text>
      </Card>
    )
  }
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Box style={{ maxHeight, overflow: 'auto' }}>
        <pre
          style={{
            margin: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </pre>
      </Box>
    </Card>
  )
}

function Explain({ children }: { children: React.ReactNode }) {
  return (
    <Text size={1} muted>
      {children}
    </Text>
  )
}

export function SearchFiles() {
  const [data, setData] = useState<SiteFiles | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/site-files')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) {
    return (
      <Container width={2} paddingX={4} paddingY={5}>
        <Card padding={4} radius={2} tone="caution" border>
          <Text size={1}>
            These files could not be read. If you are running the Studio on its own there is no site
            behind it to ask; open the Studio on the deployed site instead.
          </Text>
        </Card>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container width={2} paddingX={4} paddingY={5}>
        <Flex align="center" gap={3}>
          <Spinner muted />
          <Text size={1} muted>Reading the files</Text>
        </Flex>
      </Container>
    )
  }

  return (
    <Container width={2} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading size={2}>For search engines</Heading>
          <Explain>
            Three files nobody visiting the site will ever see, which decide a great deal about
            whether they find it in the first place. They are generated automatically from the site
            and its settings, so there is nothing to keep up to date here and nothing to break. This
            page is for reading them.
          </Explain>
        </Stack>

        {/* robots.txt */}
        <Stack space={3}>
          <Flex align="center" gap={3}>
            <Heading size={1}>robots.txt</Heading>
            <Badge tone={data.robots.staging ? 'caution' : 'positive'} fontSize={0} mode="outline">
              {data.robots.staging ? 'Blocking everything' : 'Open to search engines'}
            </Badge>
            <Box flex={1} />
            <OpenFile href={data.view.robots} />
          </Flex>

          <Explain>
            A short list of instructions for anything that reads websites automatically. It is the
            first thing a search engine asks for, and it is the only file here that can remove a site
            from Google entirely, which is why it is shown but not editable.
          </Explain>

          {data.robots.staging ? (
            <Card padding={3} radius={2} tone="caution" border>
              <Stack space={2}>
                <Text size={1} weight="semibold">Everything is blocked, on purpose</Text>
                <Text size={1}>
                  This is a preview of the new site, and the real thedesignboutique.com is still the
                  one that should appear in Google. Two identical sites competing would harm both, so
                  this copy tells every search engine to ignore it. It changes the day the new site
                  goes live, and nothing needs to be done here for that to happen.
                </Text>
              </Stack>
            </Card>
          ) : null}

          <FileBlock text={data.robots.text} maxHeight={200} />

          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={3}>
              <Text size={1} weight="semibold">What it will say once the site is live</Text>
              <Explain>
                Search engines and AI assistants are allowed everywhere except the editor itself.
                These are named one by one rather than left to a general rule, because being allowed
                is what decides whether this site can be mentioned in an AI answer at all.
              </Explain>
              <Stack space={2}>
                <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Allowed: assistants that answer questions and cite sources
                </Text>
                <Flex gap={2} wrap="wrap">
                  {data.robots.answerEngines.map((bot) => (
                    <Badge key={bot} tone="positive" fontSize={0} mode="outline">{bot}</Badge>
                  ))}
                </Flex>
              </Stack>
              <Stack space={2}>
                <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Allowed: crawlers that gather pages to train future models
                </Text>
                <Flex gap={2} wrap="wrap">
                  {data.robots.trainingCrawlers.map((bot) => (
                    <Badge key={bot} tone="default" fontSize={0} mode="outline">{bot}</Badge>
                  ))}
                </Flex>
                <Explain>
                  A separate decision from the one above, and a business one rather than a technical
                  one. Allowing these means the site&rsquo;s words may end up inside a model with no
                  credit and no visit back. They are allowed because being known to a model is part of
                  being findable through one, and it can be reversed.
                </Explain>
              </Stack>
            </Stack>
          </Card>
        </Stack>

        {/* Sitemap */}
        <Stack space={3}>
          <Flex align="center" gap={3}>
            <Heading size={1}>Sitemap</Heading>
            <Badge tone="positive" fontSize={0} mode="outline">{data.sitemap.total} addresses</Badge>
            <Box flex={1} />
            <OpenFile href={data.sitemap.indexViewUrl} label="Open the index" />
          </Flex>

          <Explain>
            A list of every address on the site, handed to search engines so they do not have to
            discover pages by following links and hoping. It updates itself whenever anything is
            published, and anything set to &ldquo;do not index&rdquo; on its SEO tab is left out.
          </Explain>

          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={3}>
              <Text size={1} weight="semibold">Split into five, and why</Text>
              <Explain>
                One file would be perfectly legal at this size. They are separate because Search
                Console reports coverage per file, which turns &ldquo;89 of 123 pages are
                indexed&rdquo; into &ldquo;every page is indexed and none of the case studies
                are&rdquo;. That is the difference between a number and something to go and fix.
              </Explain>
              <Stack space={2}>
                {data.sitemap.sections.map((s) => (
                  <Card key={s.key} padding={3} radius={2} tone="transparent" border>
                    <Flex align="center" gap={3}>
                      <Box flex={1}>
                        <Stack space={2}>
                          <Text size={1} weight="semibold">{s.title}</Text>
                          <Text size={0} muted>{s.description}</Text>
                          <OpenFile href={s.viewUrl} label={s.file} />
                        </Stack>
                      </Box>
                      <Badge tone="default" fontSize={0} mode="outline" style={{ whiteSpace: 'nowrap' }}>
                        {s.count}
                      </Badge>
                    </Flex>
                  </Card>
                ))}
              </Stack>
              <Explain>
                Search Console only ever needs the one address:{' '}
                <span style={{ fontFamily: 'ui-monospace, monospace' }}>{data.sitemap.indexUrl}</span>. It
                points at the other five.
              </Explain>
            </Stack>
          </Card>
        </Stack>

        {/* llms.txt */}
        <Stack space={3}>
          <Flex align="center" gap={3}>
            <Heading size={1}>llms.txt</Heading>
            <Badge tone="default" fontSize={0} mode="outline">{data.llms.lines} entries</Badge>
            <Box flex={1} />
            <OpenFile href={data.view.llms} />
          </Flex>

          <Explain>
            A plain-language map of the site written for AI assistants rather than search engines. It
            says what the company does and which page covers what, so an assistant answering a
            question does not have to guess the shape of the site from whichever page it happened to
            land on. It is written automatically from the pages themselves.
          </Explain>

          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={2}>
              <Text size={1} weight="semibold">Worth knowing what this is and is not</Text>
              <Text size={1}>
                llms.txt is a proposed convention, not a standard, and no major AI company has
                publicly committed to reading it. It costs nothing to publish and may help. It is not
                the reason a site turns up in an AI answer: that is decided by being allowed to be
                read, being clearly written, and being well structured, which is what the robots rules
                above and the AEO tab on each page are for.
              </Text>
            </Stack>
          </Card>

          <FileBlock text={data.llms.text} maxHeight={320} />
        </Stack>
      </Stack>
    </Container>
  )
}
