import { type ContentBlock, McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler, type StatelessMcpHandler } from 'agents/mcp/server';
import { z } from 'zod';
import { base64, parseImageRef, readImage, resolveImage } from '../images.ts';
import { extractSection, loadManifest, type ManifestPage, type PageRef, parsePageRef, readPage } from './pages.ts';
import { queryPages, WEAK_SCORE } from './search.ts';

const GET_PAGES_MAX = 10;
const DEFAULT_MAX_BYTES = 60_000;
const MIN_SLICE = 1_000;

const GET_IMAGES_MAX = 4;
const DEFAULT_IMAGE_BYTES = 500_000;
const SVG_MIME = 'image/svg+xml';

const READ_ONLY = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };

const INSTRUCTIONS = `Documentation for Calagopus, an open-source game server management panel written in Rust.
Covers the Panel (web interface and API), Wings (the node daemon that runs game servers in Docker),
the DB Agent (database provisioning), extension development, installation, and migration from
Pterodactyl and Pelican.

Start with query_pages for a question ("how do I add an OAuth provider"), or list_pages when you want
to see what exists in an area. Both return page names and their size in bytes; pass those names to
get_pages to read the full Markdown. Page names are site paths such as "/docs/wings/installation",
and links inside page bodies are absolute paths in the same form, so a link can be passed straight
back to get_pages. Appending "#section-anchor" to a name reads only that section, which is worth
doing for the larger pages. Page bodies also reference screenshots by absolute path, and those go
straight to get_images when the picture answers the question faster than the prose around it.`;

function text(value: unknown) {
  return { content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}

function listed(page: ManifestPage) {
  return {
    name: page.name,
    title: page.title,
    description: page.description,
    last_updated: page.last_updated,
    bytes: page.bytes,
  };
}

function continuation(page: ManifestPage, body: string): string {
  const remaining = (page.sections ?? [])
    .filter((section) => !body.includes(`${'#'.repeat(section.level)} ${section.text}`))
    .map((section) => `#${section.anchor}`);
  if (remaining.length === 0) return '';

  return `. Not shown: ${remaining.join(' ')}`;
}

function buildServer(env: Env): McpServer {
  const server = new McpServer({ name: 'calagopus-docs', version: '1.0.0' }, { instructions: INSTRUCTIONS });

  server.registerTool(
    'list_pages',
    {
      title: 'List documentation pages',
      annotations: READ_ONLY,
      description:
        'Browse the documentation table of contents. Returns every page with its title, a one-line ' +
        'description, when it last changed and its size in bytes, so you can budget before reading. ' +
        'Use `filter` to narrow by substring against the page path, title and description - for ' +
        'example "wings" or "backup". Prefer query_pages when you have a question; use this when you ' +
        'want to see what coverage exists. Page the full list with `offset`.',
      inputSchema: z.object({
        filter: z
          .string()
          .optional()
          .describe('Case-insensitive substring matched against path, title and description.'),
        limit: z.number().int().min(1).max(200).default(50).describe('Maximum pages to return.'),
        offset: z.number().int().min(0).default(0).describe('Pages to skip, for paging through `total`.'),
      }),
    },
    async ({ filter, limit, offset }) => {
      const manifest = await loadManifest(env);
      const needle = filter?.toLowerCase();

      const matched = needle
        ? manifest.pages.filter((page) =>
            `${page.name} ${page.title} ${page.description}`.toLowerCase().includes(needle),
          )
        : manifest.pages;

      const window = matched.slice(offset, offset + limit);

      return text({
        total: matched.length,
        offset,
        returned: window.length,
        truncated: offset + window.length < matched.length,
        results: window.map(listed),
      });
    },
  );

  server.registerTool(
    'get_pages',
    {
      title: 'Read documentation pages',
      annotations: READ_ONLY,
      description:
        `Read the full Markdown of up to ${GET_PAGES_MAX} documentation pages. Takes page names as ` +
        'returned by list_pages or query_pages (site paths such as "/docs/wings/installation"), or a ' +
        'link copied from a page body. A full URL, a trailing ".md" and any casing all resolve. ' +
        'Append "#section-anchor" to read only that section of a page instead of all of it. Output is ' +
        `capped at \`max_bytes\` (default ${DEFAULT_MAX_BYTES}). ` +
        'Pages are read in the order you list them, so put the most important first: the budget is ' +
        'spent in that order, the page that straddles it is truncated with its remaining section ' +
        'anchors listed, and anything after is declined rather than skipped over. Check the `bytes` ' +
        'field from list_pages or query_pages first when reading several pages at once.',
      inputSchema: z.object({
        names: z
          .array(z.string())
          .min(1)
          .max(GET_PAGES_MAX)
          .describe(`Page names to read, at most ${GET_PAGES_MAX} per call. Duplicates are collapsed.`),
        max_bytes: z
          .number()
          .int()
          .min(1000)
          .max(400_000)
          .default(DEFAULT_MAX_BYTES)
          .describe('Approximate ceiling on total Markdown returned.'),
      }),
    },
    async ({ names, max_bytes }) => {
      const manifest = await loadManifest(env);
      const meta = new Map(manifest.pages.map((page) => [page.name, page]));

      const refs = new Map<string, PageRef>();
      for (const requested of names) {
        const ref = parsePageRef(requested);
        const key = `${ref.name}#${ref.anchor ?? ''}`;
        if (!refs.has(key)) refs.set(key, ref);
      }

      const blocks: string[] = [];
      const missing: string[] = [];
      const unread: string[] = [];
      let budget = max_bytes;

      for (const ref of refs.values()) {
        const label = ref.anchor ? `${ref.name}#${ref.anchor}` : ref.name;
        const page = meta.get(ref.name);

        if (!page) {
          missing.push(label);
          continue;
        }
        if (budget < MIN_SLICE) {
          unread.push(`${label} (${page.bytes} bytes)`);
          continue;
        }

        const markdown = await readPage(env, ref.name);
        if (markdown === null) {
          missing.push(label);
          continue;
        }

        let body = markdown.trim();
        let scope = '';

        if (ref.anchor) {
          const section = page.sections?.find((entry) => entry.anchor === ref.anchor);
          const extracted = section && extractSection(markdown, section);
          if (extracted) {
            body = extracted;
            scope = `section: #${ref.anchor}`;
          } else {
            scope = `note: no section "#${ref.anchor}" on this page, returning it whole`;
          }
        }

        let notice = '';
        if (body.length > budget) {
          const full = body.length;
          body = body.slice(0, body.lastIndexOf('\n', budget) + 1 || budget).trimEnd();
          notice = `truncated: ${body.length} of ${full} bytes${continuation(page, body)}`;
        }

        budget -= body.length;
        blocks.push(
          [
            `# ${ref.name}`,
            page.title ? `title: ${page.title}` : null,
            page.last_updated ? `last_updated: ${page.last_updated}` : null,
            scope || null,
            notice || null,
            '',
            body,
          ]
            .filter((line) => line !== null)
            .join('\n'),
        );
      }

      if (unread.length > 0) {
        blocks.push(
          `# not returned\n\nThe ${max_bytes} byte budget ran out before these, which were requested ` +
            `after the pages above: ${unread.join('; ')}. Ask for them in another call, raise ` +
            'max_bytes, or read a single section with "#anchor".',
        );
      }
      if (missing.length > 0) {
        blocks.push(
          `# not found\n\nNo page matched: ${missing.join(', ')}. ` +
            'Use list_pages or query_pages to find the correct name.',
        );
      }

      return text(blocks.join('\n\n---\n\n'));
    },
  );

  server.registerTool(
    'get_images',
    {
      title: 'Read documentation screenshots',
      annotations: READ_ONLY,
      description:
        `Look at up to ${GET_IMAGES_MAX} documentation images. Takes the image paths that appear in ` +
        'page bodies returned by get_pages (site paths such as ' +
        '"/docs/panel/features/admin/images/users/list.webp"), and a full URL resolves too. Nearly ' +
        'all of them are panel screenshots, so this is what to reach for when someone asks where a ' +
        'control lives or what a screen looks like and the prose around the image does not settle ' +
        `it. Output is capped at \`max_bytes\` (default ${DEFAULT_IMAGE_BYTES}), counted before base64 ` +
        'encoding. Images are read in the order you list them, so put the most important first. ' +
        'Nothing is cropped to fit: an image the remaining budget cannot cover is declined and ' +
        'reported by name. SVG diagrams come back as their source markup instead of as a picture.',
      inputSchema: z.object({
        names: z
          .array(z.string())
          .min(1)
          .max(GET_IMAGES_MAX)
          .describe(`Image paths to read, at most ${GET_IMAGES_MAX} per call. Duplicates are collapsed.`),
        max_bytes: z
          .number()
          .int()
          .min(10_000)
          .max(2_000_000)
          .default(DEFAULT_IMAGE_BYTES)
          .describe('Ceiling on the total size of the images returned.'),
      }),
    },
    async ({ names, max_bytes }) => {
      const content: ContentBlock[] = [];
      const missing: string[] = [];
      const declined: string[] = [];
      let budget = max_bytes;

      for (const path of new Set(names.map(parseImageRef))) {
        const image = await resolveImage(env, path);
        if (image === null) {
          missing.push(path);
          continue;
        }
        if (image.bytes > budget) {
          declined.push(`${path} (${image.bytes} bytes)`);
          continue;
        }

        const bytes = await readImage(env, image);
        if (bytes === null) {
          missing.push(path);
          continue;
        }

        budget -= bytes.length;
        if (image.mime === SVG_MIME) {
          content.push({ type: 'text', text: `# ${path}\n\n${new TextDecoder().decode(bytes)}` });
          continue;
        }

        content.push({ type: 'text', text: `# ${path}` });
        content.push({ type: 'image', data: base64(bytes), mimeType: image.mime });
      }

      if (declined.length > 0) {
        content.push({
          type: 'text',
          text:
            `# not returned\n\nThe ${max_bytes} byte budget did not cover these, which were ` +
            `requested after the images above: ${declined.join('; ')}. Ask for them in another call ` +
            'or raise max_bytes.',
        });
      }
      if (missing.length > 0) {
        content.push({
          type: 'text',
          text:
            `# not found\n\nNo image matched: ${missing.join(', ')}. Image paths come from the ` +
            'Markdown that get_pages returns; read the page first and copy the path out of it.',
        });
      }

      return { content };
    },
  );

  server.registerTool(
    'query_pages',
    {
      title: 'Search the documentation',
      annotations: READ_ONLY,
      description:
        'Search the documentation by meaning and by keyword at once, and get back a ranked list of ' +
        'pages with the matching passage and its score as evidence for the ranking. Ask it a real ' +
        'question ("how do I restore a backup to a different server") or search an exact identifier ' +
        '(a config key, an error string, a function name). Follow up with get_pages to read the ' +
        `winners in full. Scores below ${WEAK_SCORE} are the noise floor rather than a match - those ` +
        'results are flagged `weak: true` and an unanswerable query returns nothing but those, so ' +
        'treat a page you only saw as weak as absent.',
      inputSchema: z.object({
        query: z.string().min(1).describe('A question, or an exact term such as a config key or error message.'),
        limit: z.number().int().min(1).max(20).default(10).describe('Maximum pages to return.'),
      }),
    },
    async ({ query, limit }) => {
      try {
        const { total, results } = await queryPages(env, query, limit);
        return text({
          query,
          total,
          returned: results.length,
          truncated: results.length < total,
          noise_floor: WEAK_SCORE,
          results,
        });
      } catch (error) {
        return {
          ...text(
            `Search is unavailable: ${error instanceof Error ? error.message : String(error)}. ` +
              `It is backed by the AI Search instance "${env.AI_SEARCH_INSTANCE}". ` +
              'list_pages and get_pages still work and can be used to browse instead.',
          ),
          isError: true,
        };
      }
    },
  );

  return server;
}

let handler: StatelessMcpHandler | undefined;

export function mcpHandler(env: Env): StatelessMcpHandler {
  handler ??= createMcpHandler(() => buildServer(env), { route: '/mcp', allowedOriginHostnames: '*' });
  return handler;
}
