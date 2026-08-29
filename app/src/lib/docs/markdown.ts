import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

/**
 * Renders doc bodies to HTML for display. Docs are written and read only by
 * authenticated org members (never shown to the public), so this trusts the
 * same way any internal wiki tool trusts its own team's content — no
 * separate sanitizer pass.
 */
export function renderDocBody(markdown: string): string {
  return marked.parse(markdown, { async: false });
}
