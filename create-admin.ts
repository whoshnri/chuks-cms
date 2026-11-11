import config from './payload.config'
import { getPayload } from 'payload'

const email = process.env.PAYLOAD_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.PAYLOAD_ADMIN_PASSWORD
if (!email || !password) throw new Error('Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD before creating the CMS admin.')
const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
if (existing.docs.length) {
  await payload.update({ collection: 'users', id: existing.docs[0].id, data: { password }, overrideAccess: true })
  console.info('CMS admin password updated.')
  process.exit(0)
}
await payload.create({ collection: 'users', data: { email, password }, overrideAccess: true })
console.info('CMS admin account created.')
process.exit(0)
