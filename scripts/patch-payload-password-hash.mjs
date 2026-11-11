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
