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

const isDigit = (char: string | undefined, radix = 10): boolean =>
  char !== undefined && char.length === 1 && !Number.isNaN(Number.parseInt(char, radix));

function isDigitRun(value: string, radix: number, strictUnderscores: boolean): boolean {
  if (value === '') return false;
  return [...value].every(
    (char, i, chars) =>
      isDigit(char, radix) ||
      (char === '_' && (!strictUnderscores || (i > 0 && isDigit(chars[i - 1], radix) && isDigit(chars[i + 1], radix)))),
  );
}

function radixDigits(value: string): [number, string] | null {
  const radix = { b: 2, o: 8, x: 16 }[value.slice(0, 2).toLowerCase().replace(/^0/, '')];
  return value[0] === '0' && radix ? [radix, value.slice(2)] : null;
}

function isYaml11Sexagesimal(value: string): boolean {
  const unsigned = value.replace(/^[+-]/, '');
  const dot = unsigned.indexOf('.');
  const integer = dot === -1 ? unsigned : unsigned.slice(0, dot);
  const fraction = dot === -1 ? null : unsigned.slice(dot + 1);
  const colon = integer.indexOf(':');
  if (colon === -1) return false;
  const first = integer.slice(0, colon);
  if (!/^[0-9]/.test(first) || (fraction === null && first[0] === '0') || !/^[0-9_]+$/.test(first)) return false;
  if (
    !integer
      .slice(colon + 1)
      .split(':')
      .every((part) => /^(?:[0-9]|[0-5][0-9])$/.test(part))
  )
    return false;
  return fraction === null || /^[0-9_]*$/.test(fraction);
}

function isYaml11Timestamp(value: string): boolean {
  return /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}(?:(?:[Tt]|[ \t]+)[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}(?:[.,][0-9]*)?[ \t]*(?:Z|[+-][0-9]{1,2}(?::[0-9]{2})?)?)?$/.test(
    value,
  );
}

/** Mirrors `is_numeric` in serde_saphyr's serializer, with its default YAML 1.1 resolution. */
function isNumeric(raw: string): boolean {
  if (!/^[0-9+\-._]/.test(raw)) return false;
  let unsigned = raw.replace(/^[+-]/, '');
  if (['.inf', '.nan'].includes(unsigned.toLowerCase())) return true;
  if (isYaml11Sexagesimal(raw)) return true;
  const radix = radixDigits(unsigned);
  if (radix && isDigitRun(radix[1], radix[0], false)) return true;

  const value = raw.replaceAll('_', '');
  unsigned = value.replace(/^[+-]/, '');
  const normalizedRadix = radixDigits(unsigned);
  if (normalizedRadix) {
    const digits =
      value.startsWith('0b') || value.startsWith('0o') ? normalizedRadix[1].replace(/^[+-]/, '') : normalizedRadix[1];
    return isDigitRun(digits, normalizedRadix[0], true);
  }

  let mantissa = unsigned;
  const exponentAt = unsigned.search(/[eE]/);
  if (exponentAt !== -1) {
    if (!isDigitRun(unsigned.slice(exponentAt + 1).replace(/^[+-]/, ''), 10, true)) return false;
    mantissa = unsigned.slice(0, exponentAt);
  }
  const dot = mantissa.indexOf('.');
  if (dot === -1) return isDigitRun(mantissa, 10, true);
  const whole = mantissa.slice(0, dot);
  if (whole !== '' && !isDigitRun(whole, 10, true)) return false;
  return /^[0-9.]*$/.test(mantissa.slice(dot + 1));
}

const YAML12_WORDS = /^(?:~|null|true|false|nan|[+-]?inf|<<)$/i;
const YAML11_WORDS = /^(?:~|null|true|false|yes|no|y|n|on|off|nan|[+-]?inf|<<|=)$/i;
const needsEscaping = (value: string): boolean =>
  [...value].some((char) => {
    const code = char.codePointAt(0) as number;
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f) || [0xfeff, 0x2028, 0x2029, 0xfffe, 0xffff].includes(code);
  });
const INDICATOR_START = /^(?:[-?](?:$|\s)|[,:[\]{}#&*!|>'"%@`])/;

/**
 * Whether serde_saphyr would write a string without quotes. Values use YAML 1.1
 * ambiguity rules and may contain ':'; keys use YAML 1.2 rules and may not.
 */
function isPlainSafe(value: string, isKey: boolean): boolean {
  if (value === '' || (isKey ? YAML12_WORDS : YAML11_WORDS).test(value)) return false;
  if (isKey ? /^[+-]?(?:[0-9][0-9_]*(?:\.[0-9_]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(value) : isNumeric(value)) {
    return false;
  }
  if (!isKey && isYaml11Timestamp(value)) return false;
  if (/^(?:---|\.\.\.)(?:$|\s)/.test(value) || /^\s|\s$/.test(value)) return false;
  if (INDICATOR_START.test(value) || needsEscaping(value) || /\s#/.test(value)) return false;
  return isKey ? !value.includes(':') : !value.includes(': ') && !value.trim().endsWith(':');
}

const FOLDED_WRAP_CHARS = 80;

function scalar(value: string | number | boolean | YamlFloat, isKey = false): string {
  if (value instanceof YamlFloat) {
    return Number.isInteger(value.value) ? value.value.toFixed(1) : String(value.value);
  }
  if (typeof value !== 'string') return String(value);
  if (!isPlainSafe(value, isKey)) {
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
  }
  if (!isKey && value.length > FOLDED_WRAP_CHARS) {
    throw new Error(`config-docs: "${value}" would be written as a folded block scalar, which is not supported`);
  }
  return value;
}

const isScalar = (value: YamlValue): value is string | number | boolean | YamlFloat =>
  typeof value !== 'object' || value instanceof YamlFloat;

/**
 * Serializes a value the way `serde_saphyr` writes it: two-space indented maps,
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
  return entries.map(([key, entry]) => `${indent}${scalar(key, true)}:${toYaml(entry, indent)}`).join('');
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
