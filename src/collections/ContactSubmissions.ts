import type { CollectionConfig } from 'payload'
import { isInternalRequest } from '../runtime-env'
export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions', admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'status', 'createdAt'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => isInternalRequest(req),
    update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'organisation', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    { name: 'status', type: 'select', defaultValue: 'new', options: [{ label: 'New', value: 'new' }, { label: 'In progress', value: 'in-progress' }, { label: 'Responded', value: 'responded' }] },
  ],
}
