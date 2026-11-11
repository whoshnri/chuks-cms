import { getCloudflareContext, type CloudflareContext } from '@opennextjs/cloudflare'

const isProduction = process.env.NODE_ENV === 'production'

export const cloudflare: CloudflareContext = isProduction
  ? await getCloudflareContext({ async: true })
  : ({ env: process.env } as unknown as CloudflareContext)
