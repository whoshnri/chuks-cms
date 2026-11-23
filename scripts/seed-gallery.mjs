#!/usr/bin/env node
/**
 * Seeds the Gallery collection with the static gallery images.
 *
 * Usage:
 *   CMS_URL=https://chuks-cms.vercel.app CMS_EMAIL=you@example.com CMS_PASSWORD=... node scripts/seed-gallery.mjs
 *
 * Or with .dev.vars:
 *   source <(grep -E '^(CMS_PUBLIC_URL|PAYLOAD_)' .dev.vars | sed 's/^/export /') && \
 *   CMS_URL=$CMS_PUBLIC_URL CMS_EMAIL=you@example.com CMS_PASSWORD=... node scripts/seed-gallery.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve, basename } from 'node:path'

const CMS_URL = process.env.CMS_URL
const EMAIL = process.env.CMS_EMAIL
const PASSWORD = process.env.CMS_PASSWORD

if (!CMS_URL || !EMAIL || !PASSWORD) {
  console.error('Set CMS_URL, CMS_EMAIL, and CMS_PASSWORD env vars.')
  process.exit(1)
}

const IMAGES_DIR = resolve(import.meta.dirname, '../../web/public/assets')

const galleryItems = [
  {
    title: "Chuks Etuka and participants from Wandsworth Carers' Centre after an Unconscious Bias & Inclusive Practice training.",
    images: ['gallery-one.jpg'],
    sortOrder: 1,
  },
  {
    title: 'Cover slide for the Disability Awareness training delivered at the Old Vic Theatre.',
    images: ['gallery-two.jpg'],
    sortOrder: 2,
  },
  {
    title: 'Chuks checking in with a breakout group during the training.',
    images: ['gallery-three.jpg'],
    sortOrder: 3,
  },
  {
    title: 'Chuks facilitating a session with staff of the Old Vic Theatre.',
    images: ['gallery-four.jpg'],
    sortOrder: 4,
  },
  {
    title: 'Chuks delivering a session with EDI Champions for Advance UK.',
    images: ['gallery-advance-uk.jpg'],
    sortOrder: 5,
  },
]

async function login() {
  const res = await fetch(`${CMS_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.token
}

async function uploadMedia(token, filePath, alt) {
  const file = readFileSync(filePath)
  const form = new FormData()
  form.append('file', new Blob([file], { type: 'image/jpeg' }), basename(filePath))
  form.append('alt', alt)
  form.append('_payload', JSON.stringify({ alt }))

  const res = await fetch(`${CMS_URL}/api/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`  Upload error (${res.status}): ${text.slice(0, 500)}`)
    throw new Error(`Upload failed for ${basename(filePath)}: ${res.status}`)
  }
  const data = JSON.parse(text)
  console.log(`  Uploaded ${basename(filePath)} → media id ${data.doc.id}`)
  return data.doc.id
}

async function createGalleryItem(token, title, mediaIds, sortOrder) {
  const images = mediaIds.map((id) => ({ image: id }))
  const res = await fetch(`${CMS_URL}/api/gallery`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, images, sortOrder }),
  })
  if (!res.ok) throw new Error(`Gallery create failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  console.log(`  Created gallery item "${title.slice(0, 50)}..." → id ${data.doc.id}`)
  return data.doc.id
}

async function main() {
  console.log('Logging in...')
  const token = await login()
  console.log('Authenticated.\n')

  for (const item of galleryItems) {
    console.log(`Seeding: ${item.title.slice(0, 60)}...`)
    const mediaIds = []
    for (const img of item.images) {
      const id = await uploadMedia(token, resolve(IMAGES_DIR, img), item.title)
      mediaIds.push(id)
    }
    await createGalleryItem(token, item.title, mediaIds, item.sortOrder)
    console.log()
  }

  console.log('Done! All gallery items seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
