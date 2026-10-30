declare module 'hyphen/sr-cyrl' {
  const patterns: { hyphenateHTMLSync(html: string, options?: { hyphenChar?: string; minWordLength?: number }): string }
  export default patterns
}
