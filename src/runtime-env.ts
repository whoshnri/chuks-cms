import { cloudflare } from './cloudflare-context'

export type RuntimeBindings = {
  DATABASE_URL?: string
  CMS_INTERNAL_TOKEN?: string
  PAYLOAD_SECRET?: string
  CMS_PUBLIC_URL?: string
  R2_BUCKET?: string
  R2_ENDPOINT?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  HYPERDRIVE?: { connectionString: string }
}

export const runtimeEnv = cloudflare.env as typeof cloudflare.env & RuntimeBindings

export function isInternalRequest(req: { headers: Headers }) {
  const token = process.env.CMS_INTERNAL_TOKEN || runtimeEnv.CMS_INTERNAL_TOKEN
  return Boolean(token && req.headers.get('x-cms-internal-token') === token)
}
