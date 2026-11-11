export {}

process.env.PAYLOAD_PUSH = 'false'

const [{ default: config }, { getPayload }, { insightArticles, insightCategories }] = await Promise.all([
  import('./payload.config'),
  import('payload'),
  import('../web/components/insights-data'),
])
const { paragraphsToArticleBody } = await import('./src/lib/article-content')

const payload = await getPayload({ config })
let createdArticles = 0
let existingArticles = 0

for (const category of insightCategories) {
  const found = await payload.find({ collection: 'categories', where: { slug: { equals: category.slug } }, limit: 1, overrideAccess: true })
  if (!found.docs.length) await payload.create({ collection: 'categories', data: category, overrideAccess: true })
}

for (const article of insightArticles) {
  const found = await payload.find({
    collection: 'posts',
    where: { slug: { equals: article.slug } },
    limit: 1,
    overrideAccess: true,
    context: { skipLegacyArticleBodyHydration: true },
  })
  if (found.docs.length) {
    if (!found.docs[0].body) {
      await payload.update({
        collection: 'posts',
        id: found.docs[0].id,
        data: { body: paragraphsToArticleBody(article.paragraphs) },
        overrideAccess: true,
      })
    }
    existingArticles += 1
    continue
  }
  const category = await payload.find({ collection: 'categories', where: { slug: { equals: article.categorySlug } }, limit: 1, overrideAccess: true })
  const categoryID = category.docs[0]?.id
  if (!categoryID) throw new Error(`Missing category ${article.categorySlug}`)
  await payload.create({
    collection: 'posts',
    draft: false,
    overrideAccess: true,
    data: {
      title: article.title, slug: article.slug, category: categoryID, categorySlug: article.categorySlug,
      publishedAt: new Date(article.date).toISOString(), minutes: article.minutes, excerpt: article.excerpt,
      image: article.image, imageAlt: article.imageAlt,
      body: paragraphsToArticleBody(article.paragraphs),
      content: article.paragraphs.map((paragraph) => ({ paragraph })), _status: 'published',
    },
  })
  createdArticles += 1
}

console.info(`Seeded ${insightCategories.length} categories; created ${createdArticles} posts and kept ${existingArticles} existing posts.`)
process.exit(0)
