import type { CollectionConfig } from 'payload'
export const Categories: CollectionConfig = {
  slug: 'categories', admin: { useAsTitle: 'label' },
  access: { read: () => true, create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
  fields: [{ name: 'label', type: 'text', required: true, unique: true }, { name: 'slug', type: 'text', required: true, unique: true }],
}
