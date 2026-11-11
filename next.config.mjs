import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'

const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  experimental: {
    // Payload route analysis initializes a local Workers runtime during builds.
    // Keep that initialization serial so Miniflare's SQLite state is not contended.
    cpus: 1,
  },
  turbopack: {
    root: path.resolve(process.cwd(), '..'),
  },
}

export default withPayload(nextConfig)
