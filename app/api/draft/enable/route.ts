import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/lib/client'

/**
 * Switches preview on for the person who clicked Preview in the Studio.
 *
 * The check is done by Sanity rather than by us. The Studio signs the request
 * with the editor's own session, this route asks Sanity whether that signature
 * is genuine, and only then sets the preview cookie. A shared secret in a URL
 * would have been simpler and worse: those get copied into emails and chat
 * messages, and anyone holding one could read unpublished work.
 */

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN }),
})
