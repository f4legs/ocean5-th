// Shared markdown normalization for streamed AI reports.
// Keeps display and persistence consistent across pages and API routes.

export function normalizeMarkdown(text: string): string {
  const normalizedNewlines = text.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').trim()
  if (!normalizedNewlines) return ''

  return normalizedNewlines
    .replace(/^```(?:[a-z0-9_-]+)?[ \t]*\n/i, '')
    .replace(/\n```[ \t]*$/, '')
    .trim()
    .replace(/^(#{1,6})([^\s#\n])/gm, '$1 $2')
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
}
