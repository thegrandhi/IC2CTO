import { marked, type Tokens } from 'marked';
import { memo, useMemo } from 'react';

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    // External links open in a new tab so an installed app never navigates away.
    link(this: { parser: { parseInline(tokens: Tokens.Link['tokens']): string } }, token: Tokens.Link) {
      const text = this.parser.parseInline(token.tokens);
      const external = /^https?:/.test(token.href);
      const title = token.title ? ` title="${token.title.replace(/"/g, '&quot;')}"` : '';
      return `<a href="${token.href}"${title}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
  },
});

/** Renders Markdown from the app's own bundled content (trusted). */
export const Markdown = memo(function Markdown({ text, className, inline }: { text: string; className?: string; inline?: boolean }) {
  const html = useMemo(() => (inline ? marked.parseInline(text, { async: false }) : marked.parse(text, { async: false })), [text, inline]);
  if (inline) return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  return <div className={`md ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
});
