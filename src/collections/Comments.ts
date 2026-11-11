import type { CollectionConfig } from 'payload'
import { isInternalRequest } from '../runtime-env'
export const Comments: CollectionConfig = {
  slug: 'comments', admin: { useAsTitle: 'name', defaultColumns: ['name', 'articleSlug', 'createdAt'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => isInternalRequest(req),
    update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 80 },
    { name: 'body', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'articleSlug', type: 'text', required: true, index: true },
    { name: 'status', type: 'select', required: true, defaultValue: 'approved', admin: { hidden: true }, options: [{ label: 'Pending review', value: 'pending' }, { label: 'Approved', value: 'approved' }, { label: 'Rejected', value: 'rejected' }] },
  ],
}
