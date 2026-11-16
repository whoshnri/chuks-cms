/**
 * Imports posts from a CSV whose columns match the `posts` collection:
 * title, slug, category, categorySlug, publishedAt, minutes, excerpt, image, imageAlt, body, _status
 *
 * `body` is a Lexical editor state as JSON. Missing categories are created.
 * Posts whose slug already exists are skipped, so the import is safe to re-run.
 *
 *   bun run import:posts                          imports data/linkedin-posts.csv
 *   bun run import:posts path/to/file.csv         imports another file
 *   bun run import:posts --dry-run                parses and lists rows without touching the database
 */
import { readFile } from 'node:fs/promises'

process.env.PAYLOAD_PUSH = 'false'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const file = args.find((arg) => !arg.startsWith('--')) || 'data/linkedin-posts.csv'

/** Minimal RFC 4180 parser: quoted fields, escaped quotes and newlines inside quotes. */
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

const rows = parseCSV(await readFile(file, 'utf8'))
const required = ['title', 'slug', 'category', 'categorySlug', 'excerpt', 'body']
for (const [index, row] of rows.entries()) {
  for (const name of required) if (!row[name]) throw new Error(`Row ${index + 2}: missing "${name}"`)
  JSON.parse(row.body)
}

if (dryRun) {
  for (const row of rows) console.info(`${row.publishedAt.slice(0, 10)}  ${row.categorySlug.padEnd(22)} ${row.slug}`)
  console.info(`Parsed ${rows.length} posts from ${file}. Nothing was written.`)
  process.exit(0)
}

const [{ default: config }, { getPayload }] = await Promise.all([import('./payload.config'), import('payload')])
const payload = await getPayload({ config })
const categoryIDs = new Map<string, number | string>()
let created = 0
let skipped = 0

for (const row of rows) {
  if (!categoryIDs.has(row.categorySlug)) {
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: row.categorySlug } }, limit: 1, overrideAccess: true })
    const category = found.docs[0] || await payload.create({ collection: 'categories', data: { label: row.category, slug: row.categorySlug }, overrideAccess: true })
    categoryIDs.set(row.categorySlug, category.id)
  }

  const existing = await payload.find({
    collection: 'posts',
    where: { slug: { equals: row.slug } },
    limit: 1,
    draft: true,
    overrideAccess: true,
    context: { skipLegacyArticleBodyHydration: true },
  })
  if (existing.docs.length) { skipped += 1; continue }

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

console.info(`Imported ${created} posts from ${file}; skipped ${skipped} that already exist.`)
process.exit(0)
