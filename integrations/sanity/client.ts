import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, privateToken, projectId, studioUrl } from './env'

// Only create client if Sanity is configured
export const client: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: 'published',
      token: privateToken,
      stega: {
        studioUrl,
        filter: (props) => {
          if (props.sourcePath.at(-1) === 'title') {
            return true
          }

          return props.filterDefault(props)
        },
      },
    })
  : null
