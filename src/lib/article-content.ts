type LexicalText = {
  detail: number
  format: number
  mode: 'normal'
  style: string
  text: string
  type: 'text'
  version: 1
}

type LexicalElement = {
  children: Array<LexicalElement | LexicalText>
  direction: null
  format: ''
  indent: number
  tag?: 'h2'
  type: 'heading' | 'paragraph' | 'quote' | 'root'
  version: 1
}

const sectionTitles = ['The context', 'What to consider', 'A practical next step']

function textNode(text: string): LexicalText {
  return { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 }
}

function element(type: 'heading' | 'paragraph' | 'quote', text: string): LexicalElement {
  return {
    children: [textNode(text)],
    direction: null,
    format: '',
    indent: 0,
    ...(type === 'heading' ? { tag: 'h2' as const } : {}),
    type,
    version: 1,
  }
}

/** Converts the original paragraph-only articles into a single Lexical editor state. */
export function paragraphsToArticleBody(paragraphs: string[]) {
  const firstBoundary = Math.ceil(paragraphs.length / 3)
  const secondBoundary = Math.ceil((paragraphs.length * 2) / 3)
  const sections = [
    { title: sectionTitles[0], paragraphs: paragraphs.slice(0, firstBoundary) },
    { title: sectionTitles[1], paragraphs: paragraphs.slice(firstBoundary, secondBoundary) },
    { title: sectionTitles[2], paragraphs: paragraphs.slice(secondBoundary) },
  ].filter((section) => section.paragraphs.length > 0)

  return {
    root: {
      children: sections.flatMap((section) => [
        element('heading', section.title),
        ...section.paragraphs.map((paragraph) => element(
          paragraph.startsWith('People don’t stop speaking up') ? 'quote' : 'paragraph',
          paragraph,
        )),
      ]),
      direction: null,
      format: '',
      indent: 0,
      type: 'root' as const,
      version: 1 as const,
    },
  }
}
