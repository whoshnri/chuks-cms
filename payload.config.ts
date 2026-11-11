import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import { runtimeEnv } from './src/runtime-env'
import { Users } from './src/collections/Users'
import { Posts } from './src/collections/Posts'
import { Categories } from './src/collections/Categories'
import { Comments } from './src/collections/Comments'
import { ContactSubmissions } from './src/collections/ContactSubmissions'
import { Media } from './src/collections/Media'

const databaseURL = process.env.DATABASE_URL || runtimeEnv.DATABASE_URL || runtimeEnv.HYPERDRIVE?.connectionString || 'postgres://placeholder:placeholder@127.0.0.1:5432/placeholder'
const isProduction = process.env.NODE_ENV === 'production'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || runtimeEnv.PAYLOAD_SECRET || 'local-only-change-this-payload-secret-before-deploy',
  serverURL: process.env.CMS_PUBLIC_URL || runtimeEnv.CMS_PUBLIC_URL,
  admin: { user: Users.slug, importMap: { baseDir: process.cwd() } },
  editor: lexicalEditor(),
  collections: [Users, Posts, Categories, Comments, ContactSubmissions, Media],
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
      // Payload retains a client for reconnect handling and hooks can issue nested queries.
      max: 5,
      connectionTimeoutMillis: 30_000,
    },
    push: !isProduction && process.env.PAYLOAD_PUSH !== 'false',
  }),
  plugins: [
    s3Storage({
      enabled: Boolean(runtimeEnv.R2_BUCKET && runtimeEnv.R2_ENDPOINT && runtimeEnv.R2_ACCESS_KEY_ID && runtimeEnv.R2_SECRET_ACCESS_KEY),
      collections: { media: true },
      bucket: runtimeEnv.R2_BUCKET || '',
      config: {
        credentials: { accessKeyId: runtimeEnv.R2_ACCESS_KEY_ID || '', secretAccessKey: runtimeEnv.R2_SECRET_ACCESS_KEY || '' },
        endpoint: runtimeEnv.R2_ENDPOINT,
        region: 'auto',
        forcePathStyle: true,
      },
    }),
  ],
  typescript: { outputFile: './src/payload-types.ts' },
})
