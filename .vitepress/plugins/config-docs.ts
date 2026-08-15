import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type ConfigDoc,
  type ConfigNote,
  type ConfigOption,
  type ConfigSection,
  YamlFloat,
  type YamlValue,
} from '../data/config/types.ts';

/** Plain scalars that YAML would read back as something other than a string. */
const AMBIGUOUS_SCALAR = /^(?:[-+]?\d+(?:\.\d+)?|true|false|null|~|yes|no|on|off)$/i;
const NEEDS_QUOTING = /^[{[*&!%@`#>|'"]|^\s|\s$|:\s|\s#/;

function scalar(value: string | number | boolean | YamlFloat): string {
  if (value instanceof YamlFloat) {
    return Number.isInteger(value.value) ? value.value.toFixed(1) : String(value.value);
  }
  if (typeof value !== 'string') return String(value);
  if (value === '' || AMBIGUOUS_SCALAR.test(value) || NEEDS_QUOTING.test(value)) {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return value;
}

const isScalar = (value: YamlValue): value is string | number | boolean | YamlFloat =>
  typeof value !== 'object' || value instanceof YamlFloat;

/**
 * Serializes a value the way `serde_norway` writes it: two-space indented maps,
 * sequences kept at their parent key's indentation, empty collections inlined.
 */
function toYaml(value: YamlValue, indent: string): string {
  if (isScalar(value)) return ` ${scalar(value)}\n`;

  if (Array.isArray(value)) {
    if (value.length === 0) return ' []\n';
    return `\n${value.map((entry) => `${indent}- ${scalar(entry as string | number | boolean)}\n`).join('')}`;
  }

  if (Object.keys(value).length === 0) return ' {}\n';
  return `\n${yamlBlock(value, `${indent}  `)}`;
}

function yamlBlock(value: YamlValue, indent = ''): string {
  const entries = Object.entries(value as Record<string, YamlValue>);
  return entries.map(([key, entry]) => `${indent}${scalar(key)}:${toYaml(entry, indent)}`).join('');
}

function setPath(tree: Record<string, YamlValue>, path: string[], value: YamlValue): void {
  const [head, ...rest] = path;
  if (rest.length === 0) {
    tree[head] = value;
    return;
  }
  if (typeof tree[head] !== 'object' || tree[head] === null || Array.isArray(tree[head])) tree[head] = {};
  setPath(tree[head] as Record<string, YamlValue>, rest, value);
}

function exampleTree(doc: ConfigDoc, platform: string): Record<string, YamlValue> {
  const tree: Record<string, YamlValue> = {};

  for (const section of doc.sections) {
    if (section.inExample === false) continue;
    for (const option of section.options ?? []) {
      if (option.inExample === false) continue;
      if (option.platforms && !option.platforms.includes(platform)) continue;

      const value = option.example ?? option.platformDefaults?.[platform] ?? option.default;
      if (value === undefined) continue;
      setPath(tree, option.key.split('.'), value);
    }
  }

  return tree;
}

const renderNotes = (notes: ConfigNote[] | undefined): string[] =>
  (notes ?? []).map((note) => `::: ${note.type}${note.title ? ` ${note.title}` : ''}\n${note.body}\n:::`);

function renderOption(option: ConfigOption): string[] {
  const lead = [...renderNotes(option.notesBefore), option.description];
  // The heading sits directly on top of whatever follows it, matching the rest of the docs.
  const blocks = [`### ${option.key}\n${lead[0]}`, ...lead.slice(1)];

  if (option.values) {
    blocks.push('Available options:', option.values.map((value) => `\`${value}\``).join(', '));
  }

  if (option.default !== undefined) {
    const leaf = option.key.split('.').pop() as string;
    blocks.push(`Default value:\n\`\`\`yaml\n${yamlBlock({ [leaf]: option.default })}\`\`\``);
  }

  blocks.push(...renderNotes(option.notesAfter));
  return blocks;
}

function renderSection(section: ConfigSection): string[] {
  const blocks = [`## ${section.title}`];
  if (section.body) blocks.push(section.body);
  blocks.push(...renderNotes(section.notes));
  for (const option of section.options ?? []) blocks.push(...renderOption(option));
  return blocks;
}

function renderExample(doc: ConfigDoc): string[] {
  const blocks = [`## ${doc.example.title}`, doc.example.body];
  const block = (platform: string) => `\`\`\`yaml\n${yamlBlock(exampleTree(doc, platform))}\`\`\``;

  if (doc.example.platforms.length === 1) {
    blocks.push(block(doc.example.platforms[0].id));
    return blocks;
  }

  const tabs = doc.example.platforms.map((platform) => `=== ${platform.label}\n\n${block(platform.id)}`);
  blocks.push(`::::tabs\n${tabs.join('\n\n')}\n\n::::`);
  return blocks;
}

export function renderConfigDoc(doc: ConfigDoc): string {
  const blocks = [
    `---\ntitle: ${doc.pageTitle}\ndescription: ${doc.description}\n---`,
    `<!-- Generated from ${doc.sourceFile} by .vitepress/plugins/config-docs.ts - do not edit by hand. -->`,
    `# ${doc.title}`,
    doc.intro,
    ...doc.sections.flatMap(renderSection),
    ...renderExample(doc),
  ];

  return `${blocks.filter(Boolean).join('\n\n')}\n`;
}

/** Returns every dotted path present in a document's generated example config. */
export function configDocPaths(doc: ConfigDoc): Set<string> {
  const paths = new Set<string>();
  const walk = (value: YamlValue, prefix: string) => {
    if (isScalar(value) || Array.isArray(value)) return;
    for (const [key, entry] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.add(path);
      walk(entry, path);
    }
  };
  for (const platform of doc.example.platforms) walk(exampleTree(doc, platform.id), '');
  return paths;
}

/**
 * Writes each document to its markdown file, skipping files whose content is
 * already up to date so the dev server doesn't reload on every config load.
 */
export async function writeConfigDocs(docs: ConfigDoc[], srcDir: string): Promise<void> {
  await Promise.all(
    docs.map(async (doc) => {
      const target = join(srcDir, doc.outFile);
      const content = renderConfigDoc(doc);
      const current = await readFile(target, 'utf8').catch(() => null);
      if (current === content) return;

      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    }),
  );
}
