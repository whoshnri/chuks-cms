import type { CollectionConfig } from 'payload'
export const Media: CollectionConfig = {
  slug: 'media', upload: { mimeTypes: ['image/*'], imageSizes: [{ name: 'card', width: 900 }, { name: 'hero', width: 1800 }] },
  access: { read: () => true, create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
  fields: [{ name: 'alt', type: 'text', required: true }],
}
