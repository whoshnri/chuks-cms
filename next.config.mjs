import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  experimental: {
    // Payload route analysis initializes a local Workers runtime during builds.
    // Keep that initialization serial so Miniflare's SQLite state is not contended.
    cpus: 1,
  },
}

export default withPayload(nextConfig)
