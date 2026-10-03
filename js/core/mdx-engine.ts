/**
 * CliniPortal — Standalone MDX Engine for Guidelines
 * Path: js/core/mdx-engine.ts
 */

export interface ParsedMdxResult {
  frontmatter: Record<string, any>;
  title: string;
  description: string;
  html: string;
  toc: Array<{ id: string; text: string; level: number }>;
}

export class CliniMdxEngine {
  public parse(rawMdx: string): ParsedMdxResult {
    if (!rawMdx) {
      return { frontmatter: {}, title: '', description: '', html: '', toc: [] };
    }

    let content = rawMdx;
    const frontmatter: Record<string, any> = {};
    const toc: Array<{ id: string; text: string; level: number }> = [];

    // 1. Extract YAML Frontmatter
    if (content.startsWith('---')) {
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      if (match) {
        const yamlStr = match[1];
        content = content.slice(match[0].length);

        yamlStr.split('\n').forEach(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            const key = line.slice(0, colonIdx).trim();
            let val = line.slice(colonIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (val === 'true') frontmatter[key] = true;
            else if (val === 'false') frontmatter[key] = false;
            else if (!isNaN(Number(val)) && val !== '') frontmatter[key] = Number(val);
            else frontmatter[key] = val;
          }
        });
      }
    }

    const title = frontmatter.title || '';
    const description = frontmatter.description || '';

    // 2. Process Custom MDX Components / Callouts
    content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+([^>]*?)\/>/g, (_m, tagName, attrs) => {
      return `<div class="mdx-component mdx-${tagName.toLowerCase()}" ${attrs}></div>`;
    });

    content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+([^>]*?)>([\s\S]*?)<\/\1>/g, (_m, tagName, attrs, inner) => {
      return `<div class="mdx-callout mdx-${tagName.toLowerCase()}" ${attrs}><div class="mdx-callout-inner">${inner}</div></div>`;
    });

    // 3. Process Markdown Headings with {#custom-id}
    content = content.replace(/^(#{1,6})\s+(.*?)(?:\s+\{#([a-zA-Z0-9_\-]+)\})?$/gm, (_m, hashes, text, customId) => {
      const level = hashes.length;
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      const id = customId || cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      toc.push({ id, text: cleanText, level });
      return `<h${level} id="${id}" class="heading-level-${level}">${text}</h${level}>`;
    });

    // 4. Markdown Quotes
    content = content.replace(/^\>\s+(.*$)/gm, '<blockquote class="ebm-quote">$1</blockquote>');

    // 5. Bold & Italic & Code
    content = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // 6. Markdown Tables
    content = content.replace(/((?:^\|.*?\|\r?\n)+)/gm, (tableMatch) => {
      const lines = tableMatch.trim().split('\n').filter(l => l.trim().startsWith('|'));
      if (lines.length < 2) return tableMatch;

      let tableHtml = '<div class="table-responsive"><table class="ebm-guideline-table">';
      let isHeader = true;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^\|[-:\s|]+\|$/.test(line)) {
          isHeader = false;
          continue;
        }

        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        const tag = isHeader ? 'th' : 'td';

        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += `<${tag}>${cell}</${tag}>`;
        });
        tableHtml += '</tr>';

        if (isHeader) {
          isHeader = false;
        }
      }

      tableHtml += '</table></div>';
      return tableHtml;
    });

    // 7. Unordered Lists
    content = content.replace(/^-\s+(.*$)/gm, '<li class="ebm-list-item">$1</li>');
    content = content.replace(/((?:<li class="ebm-list-item">.*<\/li>\r?\n?)+)/g, '<ul class="ebm-list">$1</ul>');

    // 8. Line breaks to paragraphs
    const paragraphs = content.split(/\r?\n\r?\n/).map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|div|ul|ol|table|blockquote|pre)/i.test(trimmed)) {
        return trimmed;
      }
      return `<p class="ebm-paragraph">${trimmed.replace(/\r?\n/g, '<br/>')}</p>`;
    });

    const html = paragraphs.filter(Boolean).join('\n');

    return {
      frontmatter,
      title,
      description,
      html,
      toc
    };
  }
}

export const cliniMdxEngine = new CliniMdxEngine();
