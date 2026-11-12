import { getCloudflareContext, type CloudflareContext } from '@opennextjs/cloudflare'

const isProduction = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'

// Vercel runs Payload in the Node.js runtime, where normal environment
// variables replace Cloudflare bindings.
export const cloudflare: CloudflareContext = isProduction && !isVercel
  ? await getCloudflareContext({ async: true })
  : ({ env: process.env } as unknown as CloudflareContext)
