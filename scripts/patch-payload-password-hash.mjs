import { readFile, writeFile } from 'node:fs/promises'

// Cloudflare Workers currently limit PBKDF2 to 100,000 iterations. Payload's
// default is higher, so patch the bundled runtime before each CMS build.
const payloadEntry = import.meta.resolve('payload')
const passwordModule = new URL('./auth/strategies/local/generatePasswordSaltHash.js', payloadEntry)
const source = await readFile(passwordModule, 'utf8')
const current = 'const currentPasswordHashIterations = 600000;'
const compatible = 'const currentPasswordHashIterations = 100000;'

if (source.includes(current)) {
  await writeFile(passwordModule, source.replace(current, compatible))
  console.info('Configured Payload password hashing for Cloudflare Workers.')
} else if (!source.includes(compatible)) {
  throw new Error('Unable to find Payload password-hash iteration setting.')
}

// Payload keeps one `pg` client checked out forever to listen for reconnects.
// That leaves a live TCP handle in a Worker and prevents the request from
// completing. Keep the listener, but return the client to the pool.
const postgresEntry = import.meta.resolve('@payloadcms/db-postgres')
const postgresConnectModule = new URL('./connect.js', postgresEntry)
const postgresSource = await readFile(postgresConnectModule, 'utf8')
const heldClient = '    });\n};\nexport const connect = async function connect'
const releasedClient = '    });\n    result.release();\n};\nexport const connect = async function connect'

if (postgresSource.includes(heldClient)) {
  await writeFile(postgresConnectModule, postgresSource.replace(heldClient, releasedClient))
  console.info('Configured Payload Postgres pooling for Cloudflare Workers.')
} else if (!postgresSource.includes(releasedClient)) {
  throw new Error('Unable to find Payload Postgres connection lifecycle.')
}
