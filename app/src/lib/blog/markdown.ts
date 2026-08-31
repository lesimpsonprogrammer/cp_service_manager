import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

/**
 * Renders blog post bodies to HTML. Posts are public-facing but only
 * written by authenticated org members (the same trust boundary as docs —
 * see src/lib/docs/markdown.ts), so no separate sanitizer pass.
 */
export function renderPostBody(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
