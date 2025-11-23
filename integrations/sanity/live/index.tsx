import { defineLive } from 'next-sanity/live'
import { client } from '../client'
import { privateToken, publicToken } from '../env'

// Only define live features if Sanity is configured
const live = client
  ? defineLive({
      client,
      browserToken: publicToken,
      serverToken: privateToken,
    })
  : null

export const sanityFetch = live?.sanityFetch ?? null
export const SanityLive = live?.SanityLive ?? (() => null)
