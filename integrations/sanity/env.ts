export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-03-15'

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || ''

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  ''

export const studioUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/studio'
    : `${process.env.NEXT_PUBLIC_BASE_URL || ''}/studio`

export const publicToken = process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN || ''

export const privateToken = process.env.SANITY_PRIVATE_TOKEN

export const previewURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_BASE_URL || ''
