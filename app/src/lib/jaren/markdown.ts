import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

/**
 * Renders Jaren's replies to HTML. Unlike blog/docs markdown (written by
 * trusted org members), this text comes from a model response, so raw HTML
 * tags are escaped before parsing rather than passed through.
 */
export function renderChatMarkdown(markdown: string): string {
  const escaped = markdown.replace(/</g, "&lt;");
  return marked.parse(escaped, { async: false }) as string;
}
