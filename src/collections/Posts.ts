import type { CollectionConfig } from 'payload'
import { paragraphsToArticleBody } from '../lib/article-content'
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'publishedAt', '_status'] },
  hooks: {
    afterRead: [({ doc, req }) => {
      if (req.context.skipLegacyArticleBodyHydration) return doc
      const post = doc as unknown as { body?: unknown; content?: { paragraph?: string }[] }
      if (!post.body && Array.isArray(post.content)) {
        post.body = paragraphsToArticleBody(post.content.map((item) => item.paragraph || '').filter(Boolean))
      }
      return doc
    }],
    beforeChange: [async ({ data, req }) => {
      const categoryID = typeof data.category === 'object' && data.category ? data.category.id : data.category
      if (categoryID) {
        const category = await req.payload.findByID({ collection: 'categories', id: categoryID, depth: 0, overrideAccess: true })
        data.categorySlug = category.slug
      }
      return data
    }],
  },
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    read: ({ req }) => req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, index: true },
    { name: 'categorySlug', type: 'text', required: true, admin: { position: 'sidebar', readOnly: true } },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'minutes', type: 'number', min: 1, defaultValue: 5 },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'image', type: 'text' },
    { name: 'imageAlt', type: 'text' },
    { name: 'coverImage', type: 'relationship', relationTo: 'media' },
    {
      name: 'body',
      label: 'Content',
      type: 'richText',
      required: true,
      admin: { description: 'Write the full article here. Use Heading 1 or Heading 2 for sections that should appear in the article navigator.' },
    },
    {
      name: 'content',
      type: 'array',
      required: false,
      admin: { hidden: true },
      fields: [{ name: 'paragraph', type: 'textarea', required: true }],
    },
  ],
}
