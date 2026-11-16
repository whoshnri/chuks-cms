export {}

process.env.PAYLOAD_PUSH = 'false'

import { readFile } from 'node:fs/promises'

function parseCSV(input: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const text = input.replace(/^﻿/, '')

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1 }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field); field = ''
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
    } else field += char
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }

  const [header, ...records] = rows
  return records.map((record) => Object.fromEntries(header.map((name, index) => [name, record[index] ?? ''])))
}

const file = 'data/linkedin-posts.csv'
const rows = parseCSV(await readFile(file, 'utf8'))

const [{ default: config }, { getPayload }] = await Promise.all([import('./payload.config'), import('payload')])
const payload = await getPayload({ config })

// Delete all existing posts
const allPosts = await payload.find({ collection: 'posts', limit: 1000, depth: 0, overrideAccess: true, context: { skipLegacyArticleBodyHydration: true } })
for (const post of allPosts.docs) {
  await payload.delete({ collection: 'posts', id: post.id, overrideAccess: true })
}
console.info(`Deleted ${allPosts.docs.length} existing posts.`)

// Delete all existing categories
const allCategories = await payload.find({ collection: 'categories', limit: 1000, depth: 0, overrideAccess: true })
for (const cat of allCategories.docs) {
  await payload.delete({ collection: 'categories', id: cat.id, overrideAccess: true })
}
console.info(`Deleted ${allCategories.docs.length} existing categories.`)

// Seed categories and posts from CSV
const categoryIDs = new Map<string, number | string>()
let created = 0

for (const row of rows) {
  if (!categoryIDs.has(row.categorySlug)) {
    const category = await payload.create({ collection: 'categories', data: { label: row.category, slug: row.categorySlug }, overrideAccess: true })
    categoryIDs.set(row.categorySlug, category.id)
  }

  const status = row._status === 'published' ? 'published' : 'draft'
  await payload.create({
    collection: 'posts',
    draft: status === 'draft',
    overrideAccess: true,
    data: {
      title: row.title,
      slug: row.slug,
      category: categoryIDs.get(row.categorySlug) as number,
      categorySlug: row.categorySlug,
      publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : undefined,
      minutes: Number(row.minutes) || 5,
      excerpt: row.excerpt,
      image: row.image || undefined,
      imageAlt: row.imageAlt || undefined,
      body: JSON.parse(row.body),
      _status: status,
    },
  })
  created += 1
}

console.info(`Seeded ${categoryIDs.size} categories and ${created} posts from ${file}.`)
process.exit(0)
