'use client'

import { useEffect, useState } from 'react'
import { Box, Card, Stack, Text } from '@sanity/ui'
import { type ObjectInputProps } from 'sanity'

/**
 * The Notifications tab, with a warning when the site cannot actually send.
 *
 * Filling in a list of recipients reads as "these people will be emailed", and
 * there is nothing in the interface to suggest otherwise. If no Resend key has
 * been saved, nobody is emailed and nothing complains: submissions simply
 * arrive in the Studio and the enquiry sits unread until somebody thinks to
 * look. Somebody would eventually notice, but probably after losing an enquiry.
 *
 * So the tab asks the server whether email is configured and says plainly when
 * it is not. The check costs one request and never sees the key itself.
 */

interface Status {
  ready: boolean
  reason?: string
}

export function NotificationsInput(props: ObjectInputProps) {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/mail/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStatus(data)
      })
      .catch(() => {
        // If the check itself fails, say nothing rather than claim a problem
        // that may not exist. A false alarm here would train people to ignore
        // the warning that matters.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Stack space={4}>
      {status && !status.ready ? (
        <Card padding={3} radius={2} shadow={1} tone="caution">
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Emails are not being sent yet
            </Text>
            <Text size={1}>{status.reason}</Text>
            <Text size={1} muted>
              Anyone listed below will not hear about a submission until this is set up. Submissions
              are still being saved, so nothing is lost in the meantime: you will find them under
              Form Submissions.
            </Text>
          </Stack>
        </Card>
      ) : null}
      <Box>{props.renderDefault(props)}</Box>
    </Stack>
  )
}
