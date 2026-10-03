import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const IMPORT_RE = /^ {0,3}<<<(.*)$/;
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE_RE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
const TITLE_RE = /\s*\[(.+)\]$/;
const REGION_RE = /#([\w.-]+)$/;
const SEPARATOR_RE = /[\\/]/;
const EXTENSION_RE = /\.([a-zA-Z0-9]+)$/;
const LINES_RE = /^\d+(?:[,-]\d+)*$/;

interface SnippetImport {
  filepath: string;
  region: string;
  lines: string;
  lang: string;
  attrs: string;
  title: string;
}

// Same grammar as VitePress' own `<<<` parser: path[#region][{[lines] [lang] [attrs]}][ [title]]
function parseImport(raw: string): SnippetImport {
  let rest = raw.trim();
  let title = '';
  const titleMatch = TITLE_RE.exec(rest);
  if (titleMatch) {
    title = titleMatch[1];
    rest = rest.slice(0, titleMatch.index).trimEnd();
  }

  let lines = '';
  let lang = '';
  let attrs = '';
  const braceStart = rest.lastIndexOf('{');
  if (rest.endsWith('}') && braceStart > 0) {
    let meta = rest.slice(braceStart + 1, -1).trim();
    rest = rest.slice(0, braceStart).trimEnd();
    const first = /^\S+/.exec(meta)?.[0] ?? '';
    if (LINES_RE.test(first)) {
      lines = first;
      meta = meta.slice(first.length).trimStart();
    }
    const langMatch = /^\S+/.exec(meta);
    if (langMatch) {
      lang = langMatch[0];
      attrs = meta.slice(lang.length).trim();
    }
  }

  let region = '';
  const regionMatch = REGION_RE.exec(rest);
  if (regionMatch) {
    region = regionMatch[1];
    rest = rest.slice(0, regionMatch.index);
  }

  return { filepath: rest.trim(), region, lines, lang, attrs, title };
}

/**
 * Inlines VitePress `<<<` code snippet imports as ordinary fenced code blocks, for the raw
 * markdown we publish alongside each page. The rendered site resolves them on its own.
 */
export function expandSnippetImports(markdown: string, options: { srcDir: string; file: string }): string {
  const output: string[] = [];
  let fence: string | null = null;

  for (const line of markdown.split('\n')) {
    if (fence) {
      const closeMatch = FENCE_CLOSE_RE.exec(line);
      if (closeMatch && closeMatch[1][0] === fence[0] && closeMatch[1].length >= fence.length) fence = null;
      output.push(line);
      continue;
    }
    const fenceMatch = FENCE_RE.exec(line);
    if (fenceMatch) {
      fence = fenceMatch[1];
      output.push(line);
      continue;
    }

    const importMatch = IMPORT_RE.exec(line);
    if (!importMatch) {
      output.push(line);
      continue;
    }

    const snippet = parseImport(importMatch[1]);
    if (snippet.region) {
      throw new Error(`Snippet regions are not supported in the markdown export: ${line} (in ${options.file})`);
    }

    const path = snippet.filepath.startsWith('@')
      ? join(options.srcDir, snippet.filepath.slice(SEPARATOR_RE.test(snippet.filepath[1]) ? 2 : 1))
      : resolve(dirname(options.file), snippet.filepath);
    const content = readFileSync(path, 'utf8');
    const extension = EXTENSION_RE.exec(snippet.filepath.split(SEPARATOR_RE).pop() ?? '')?.[1] ?? '';

    const info = [
      `${snippet.lang || extension}${snippet.lines ? `{${snippet.lines}}` : ''}`,
      snippet.attrs,
      snippet.title ? `[${snippet.title}]` : '',
    ]
      .filter(Boolean)
      .join(' ');

    output.push(`\`\`\`${info}`, content.endsWith('\n') ? content.slice(0, -1) : content, '```');
  }

  return output.join('\n');
}
