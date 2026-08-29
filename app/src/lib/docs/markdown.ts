import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

const ALERT_META: Record<string, { label: string; icon: string }> = {
  NOTE: { label: "Note", icon: "ℹ️" },
  TIP: { label: "Tip", icon: "💡" },
  IMPORTANT: { label: "Important", icon: "❗" },
  WARNING: { label: "Warning", icon: "⚠️" },
  CAUTION: { label: "Caution", icon: "🛑" },
};

/**
 * Rewrites GitHub-style alert blockquotes (`> [!NOTE]` etc.) into styled
 * callout divs before handing the rest off to `marked`. Any blockquote that
 * doesn't start with a recognized `[!TYPE]` marker passes through as a
 * normal blockquote.
 */
function renderAlertBlocks(markdown: string): string {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith(">")) {
      let j = i;
      const quoteLines: string[] = [];
      while (j < lines.length && (lines[j] ?? "").startsWith(">")) {
        quoteLines.push((lines[j] ?? "").replace(/^>\s?/, ""));
        j += 1;
      }

      const marker = quoteLines[0]?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/);
      const type = marker?.[1];
      const meta = type ? ALERT_META[type] : undefined;
      if (type && meta) {
        const bodyMarkdown = quoteLines.slice(1).join("\n").trim();
        const bodyHtml = bodyMarkdown ? (marked.parse(bodyMarkdown, { async: false }) as string) : "";
        output.push(
          `<div class="doc-alert doc-alert-${type.toLowerCase()}">` +
            `<p class="doc-alert-title">${meta.icon} ${meta.label}</p>${bodyHtml}</div>`
        );
      } else {
        output.push(...quoteLines.map((l) => `> ${l}`));
      }

      i = j;
      continue;
    }

    output.push(line);
    i += 1;
  }

  return output.join("\n");
}

/**
 * Renders doc bodies to HTML for display. Docs are written and read only by
 * authenticated org members (never shown to the public), so this trusts the
 * same way any internal wiki tool trusts its own team's content — no
 * separate sanitizer pass.
 */
export function renderDocBody(markdown: string): string {
  return marked.parse(renderAlertBlocks(markdown), { async: false }) as string;
}
