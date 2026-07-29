'use client'

import { Badge, Box, Card, Container, Flex, Heading, Stack, Text } from '@sanity/ui'

/**
 * Who built this, where the guides are, and what to do when something looks wrong.
 *
 * Every question an editor has in their first month has an answer somewhere, and
 * none of those places is inside the editor. This is the page that points at
 * them, so nobody has to remember an email address or search their inbox for a
 * PDF from months ago.
 *
 * Only the instructional guides are listed. The documents asking Laney to do
 * something, the Resend setup, the Search Console account, the content findings,
 * are tasks rather than references, and a list of chores is not what somebody
 * wants when they open a page called About.
 */

const CONTACT = 'angelo@thedesignboutique.com'
const DRIVE_FOLDER = 'https://drive.google.com/drive/folders/10E40CiNUekF3mPgFuNuoCAkAMzkzZgyk'

const GUIDES: Array<{ title: string; detail: string; id: string }> = [
  {
    title: 'Editing Your Website',
    detail: 'How the editor works, written for somebody coming from WordPress. Start here.',
    id: '1RKLhqMUJ4XP02rVvnaPQqY3ogS_xe852',
  },
  {
    title: 'Forms',
    detail: 'Building forms, where enquiries go, and sending them on to a CRM.',
    id: '1-z5TRRWOdCa1KMr-KW7OEjVhRdMPtTKp',
  },
  {
    title: 'SEO Health',
    detail: 'The SEO, Search and AEO tabs beside every page, and what to do about them.',
    id: '1g85OTXgga4sjh_Vrym2VuJRyXKa_2Kny',
  },
  {
    title: 'SEO Fields',
    detail: 'Every SEO field on a page, what it does, and which ones matter.',
    id: '1b8721s04hu4TExx0BIMX91yC7tPi0Mga',
  },
  {
    title: 'SEO Toolset',
    detail: 'Redirects, dead links, the sitemap and local SEO.',
    id: '1mpRNbl4AAP18wTr_umWoXVfTI4kSPB8V',
  },
  {
    title: 'Site Speed',
    detail: 'The speed dashboard, what Google measures, and how to read the history.',
    id: '1mFaBa_L_eY66JzQ2lYuHL3OyYEkVx1YF',
  },
  {
    title: 'The Writing Assistant',
    detail: 'The optional Suggest buttons, what each drafts, and what they cost.',
    id: '1zlUZyjHVo8gWc88UjlxjSBpvKx6M9wOX',
  },
]

/** Symptom, then the first place to look. Ordered by how often it comes up. */
const TRIAGE: Array<{ symptom: string; answer: string }> = [
  {
    symptom: 'Somebody says they filled in a form and heard nothing',
    answer:
      'Look in Form Submissions first. If their message is there, the form worked and only the notification email failed, which is a setting rather than a lost enquiry.',
  },
  {
    symptom: 'A link gives an error page',
    answer:
      'Open Dead Links. If the address is listed, type where it should go and press the button. That is the whole fix.',
  },
  {
    symptom: 'A page will not appear in Google',
    answer:
      'Open that page and check the Search tab. It says what Google reports, in Google’s own words, and what to do about it.',
  },
  {
    symptom: 'A change is not showing on the site',
    answer:
      'Check for the orange dot on the document. It means there are unpublished changes: the site shows the published version until you press Publish.',
  },
  {
    symptom: 'Something looks wrong and none of the above fits',
    answer: `Email ${CONTACT}. Say what you were doing and what you expected. A screenshot saves a round trip.`,
  },
]

function Row({ title, detail, href }: { title: string; detail: string; href?: string }) {
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={2}>
        {href ? (
          <Text size={1} weight="semibold">
            <a href={href} target="_blank" rel="noreferrer">
              {title} ↗
            </a>
          </Text>
        ) : (
          <Text size={1} weight="semibold">{title}</Text>
        )}
        <Text size={1} muted>{detail}</Text>
      </Stack>
    </Card>
  )
}

export function About() {
  return (
    <Container width={1} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading size={2}>About this website</Heading>
          <Text size={1} muted>
            Where the guides are, who to ask, and what to check first when something looks wrong.
          </Text>
        </Stack>

        {/* Who to ask, first, because it is the thing people come here for. */}
        <Card padding={4} radius={2} tone="primary" border>
          <Stack space={3}>
            <Text size={1} weight="semibold">Questions and change requests</Text>
            <Stack space={2}>
              <Text size={2} weight="semibold">Angelo Marasa</Text>
              <Text size={1}>
                <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
              </Text>
            </Stack>
            <Text size={1} muted>
              Anything you want changed, anything that looks wrong, and anything you are not sure
              about. There is no such thing as a question too small: it is usually faster to ask than
              to work out whether something is deliberate.
            </Text>
          </Stack>
        </Card>

        <Stack space={3}>
          <Flex align="center" gap={3}>
            <Heading size={1}>Guides</Heading>
            <Badge tone="default" fontSize={0} mode="outline">{GUIDES.length}</Badge>
            <Box flex={1} />
            <Text size={0}>
              <a href={DRIVE_FOLDER} target="_blank" rel="noreferrer">Open the folder ↗</a>
            </Text>
          </Flex>
          <Text size={1} muted>
            Written for people rather than developers. They live in the shared Drive folder, so they
            are always the current version rather than whatever was attached to an email once.
          </Text>
          <Stack space={2}>
            {GUIDES.map((g) => (
              <Row
                key={g.id}
                title={g.title}
                detail={g.detail}
                href={`https://drive.google.com/file/d/${g.id}/view`}
              />
            ))}
          </Stack>
        </Stack>

        <Stack space={3}>
          <Heading size={1}>If something looks wrong</Heading>
          <Stack space={2}>
            {TRIAGE.map((t) => (
              <Row key={t.symptom} title={t.symptom} detail={t.answer} />
            ))}
          </Stack>
        </Stack>

        <Stack space={3}>
          <Heading size={1}>What this is built on</Heading>
          <Text size={1} muted>
            Here so that a developer picking this up later, whoever that turns out to be, does not
            have to work it out from the code.
          </Text>
          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={3}>
              <Text size={1}>
                The website is <strong>Next.js</strong>, hosted on <strong>Vercel</strong>. This
                editor is <strong>Sanity Studio</strong>, and the content lives in Sanity rather than
                in the website, which is why the two can be changed independently.
              </Text>
              <Text size={1} muted>
                There is no WordPress, no theme, no plugins, no PHP and no database of your own to
                maintain or patch. That is the main practical difference from the old site, and the
                reason there is nothing here that needs updating on a Tuesday.
              </Text>
              <Text size={1} muted>
                Everything built for this site, the schemas, the tooling and these panels, belongs to
                The Design Boutique.
              </Text>
            </Stack>
          </Card>
        </Stack>

      </Stack>
    </Container>
  )
}
