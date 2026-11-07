![Calagopus Logo](https://calagopus.com/banners/contributing-fullogo.svg)

# Contributing to the Calagopus Website & Docs

This repo is the Calagopus website and docs, built with [VitePress](https://vitepress.dev) `v2.0.0-alpha.21`. If something breaks after an update, check its [changelog](https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md).

Don't stress about following every rule perfectly. Keep changes readable and easy to review, and explain anything non-obvious.

## Before You Start

| Your change | What to do |
| --- | --- |
| Small fix: typo, broken link, missing detail | Just open a PR |
| Larger: restructuring the sidebar, splitting or merging pages, a new top-level section | A PR is fine if you'd rather show it than describe it |
| Big: reorganizing a whole section like Features, or how the docs are structured | Open an issue or ask in [Discord](https://discord.gg/uSM8tvTxBV) first |

Not sure a restructure is clean enough? Ask before you sink time into it.

## Getting Started

```bash
git clone https://github.com/calagopus/website.git
cd website
pnpm i
pnpm docs:dev
```

## AI / LLM Usage

Using AI to draft or edit a page is fine here, unlike in the [panel repo](https://github.com/calagopus/panel/blob/main/CONTRIBUTING.md#ai--llm-usage), as long as you read and rewrite it before opening the PR. You're responsible for what you submit and should be able to explain it.

- No em dashes. Use a period, comma, or "and" instead.
- No filler, no restating the obvious, no "in conclusion" or "it's worth noting that."
- No padded lists where three real points become ten bullets.
- Say it once, plainly.

If a reviewer can tell a page was AI-generated, it needs another pass.

## Making Changes

- Keep PRs focused on one thing.
- Match the existing tone: direct, practical, no fluff.
- Don't change commands, config values, or code blocks during a wording or formatting pass.
- Put long code blocks, like full proxy configs, in `web/snippets/` and use a [snippet import](https://vitepress.dev/guide/markdown#import-code-snippets): `<<< @/snippets/reverse-proxies/panel/nginx.conf{nginx}`

### Writing Commands

- **One block:** commands that always run together go in one block. Split only where the reader has to edit a file, check something, or choose.
- **No prompts:** a prompt swallows the rest of a pasted block, so use `-y` and `--no-pager` mid-block.
- **`sudo`:** use it on everything that needs root, including every `docker` command. The exceptions are Alpine blocks and rootless guides.
- **Binary installs:** use the full path, like `sudo /usr/local/bin/wings`. Some distributions leave `/usr/local/bin` off the path `sudo` uses.
- **Panel CLI:** it reads `.env` from the current directory, so binary and package installs need `cd /etc/calagopus` first.

### Sidebar

The sidebar lives in `.vitepress/data/sidebar.ts`.

- Only create a group for multiple related pages, never for one.
- Follow an existing structure for larger topics, like `Migrations`.
- Keep names short and parallel: `Database Hosts`, not `Setting up Database Hosts`.
- Check whether a page fits an existing section before adding a top-level one.
- A `link:` to a folder's `index.md` ends with a `/`, like `/docs/panel/installation/`. Otherwise the page isn't highlighted and its previous and next links are wrong.

### Naming Pages

Name a file after its sidebar entry, not its H1, so `link:` paths stay predictable.

| Filename | Sidebar entry | H1 |
| --- | --- | --- |
| `additional/ssl-certificates.md` | `SSL Certificates` | Generating SSL Certificates |
| `panel/next-steps/reverse-proxy.md` | `Setting up a Reverse Proxy` | Putting the Panel Behind a Reverse Proxy |

Moved or renamed a page? Update every link to it and add the old URL to `.vitepress/lib/redirects.ts`. Renamed a section? Add the old anchor to `.vitepress/data/moved-anchors.ts`. `pnpm docs:build` catches links to missing pages, but not broken `#anchors`. After a build, `pnpm run check-redirects` checks that every page on the live site is still a page or a redirect.

### Frontmatter

| Key | When to set it |
| --- | --- |
| `description` | Always. Plain words, ideally under 170 characters. Use double quotes if it contains `: `. |
| `title` | When the H1 isn't enough for a browser tab, like `Admin Settings` for a page whose H1 is `Settings`. |
| `prev` / `next` | Only as `false`, as below. `true` does nothing. |

Each top-level sidebar group, like `Panel` or `Compare`, keeps its previous and next links to itself:

| Page | Frontmatter |
| --- | --- |
| First in a group | `prev: false` |
| Last in a group | `next: false` |
| Not in the sidebar, like `/docs` | Both |
| Everything else | Neither |

`pnpm run check-frontmatter` lists anything wrong, and CI runs it too.

### Tabs and Dropdowns

| Use | For | Syntax |
| --- | --- | --- |
| Tabs | The reader picks one option and ignores the rest | `::::tabs`, then `=== Docker` |
| Dropdown | Something most readers can skip | `::: details Docker isn't installed yet` |

- If most of a page splits the same way, use one set of tabs at the top holding the whole guide.
- Add a key like `::::tabs key:pkg` to remember the choice across pages that share the same labels.
- Don't put required steps or warnings in a dropdown.
- A link can't open a dropdown or switch a tab. Link to a heading outside them and name the dropdown or tab in the text.

When nesting, the outer container needs more colons, or the inner closing marker closes both:

```md
:::::tabs
=== Docker

:::: details Optional steps
::: warning
Something to watch out for.
:::
::::

:::::
```

### Where Things Go

- **`next-steps/`:** setup guides for one component, like SSL or a reverse proxy, with `Docker` and `Standalone` tabs where both apply.
- **`additional/`:** anything shared between components, like `additional/ssl-certificates.md`.
- **`compare/`:** see below.

Comparison pages follow the same order: summary, which to choose, performance or architecture, features, where each side is stronger, migrating. Say where the other project is the better choice.

- Use `<Yes />` and `<No />` in feature tables, not emoji.
- End the page with `<CompareFaq />`. The answers live in `.vitepress/data/compare-faqs.ts`.
- Give new pages the same `pageClass` as the existing ones.

### Generated Pages

| Page | Edit this instead |
| --- | --- |
| `wings/configuration.md` | `.vitepress/data/config/wings.ts` |
| `db-agent/configuration.md` | `.vitepress/data/config/db-agent.ts` |
| `releases/panel.md`, `wings.md`, `db-agent.md` | Changelogs come from GitHub releases. Extra notes go in `.vitepress/data/release-notes.ts`. |

Config options show **Optional** unless you set `required: true`, or a string like `required: 'SSL'` for "Required for SSL". Almost every option has a default, so only tag one if the source shows the software can't work without it.

### Plugins & Dependencies

Adding a dependency? Say what it does and why in your PR description, or it'll probably get sent back.

| Plugin | Purpose | Docs |
| --- | --- | --- |
| `vite-imagetools` | Converts imported PNG and JPEG images to WebP, capped at 1600px wide | [Repo](https://github.com/JonasKruckenberg/imagetools) |
| `vite-plugin-image-optimizer` | Compresses PNG, JPEG and SVG images at build time, skipping WebP | [npm](https://www.npmjs.com/package/vite-plugin-image-optimizer) |
| `vitepress-plugin-mermaid` | Mermaid diagrams | [Docs](https://emersonbottero.github.io/vitepress-plugin-mermaid/) |
| `vitepress-plugin-tabs` | The `::::tabs` syntax | [Docs](https://vitepress-plugins.sapphi.red/tabs/) |
| `aiDocPlugin` (`./plugins/ai-doc.ts`) | Internal and intentionally undocumented, ignore it | n/a |

The click-to-zoom image viewer isn't a plugin. It's `.vitepress/components/ImageViewer.vue`.

## Before Opening a PR

Run the same checks CI runs:

```bash
pnpm run biome:validate
pnpm run typecheck
pnpm run check-frontmatter
pnpm docs:build
pnpm run check-worker-routes
pnpm run check-redirects
pnpm exec wrangler deploy --dry-run
```

Then check the dev server for console errors and broken links.

**`biome:validate` flags dozens of unrelated files?** That's CRLF line endings from a Windows checkout. If you cloned before `.gitattributes` existed, run `git add --renormalize .` once, plus `git config core.autocrlf false` if you set it globally.

## Commits and PRs

- Write titles like a person, not `fix` or `update docs`. Say what changed.
- In the description, explain why and call out anything non-obvious, like a new dependency, a renamed page, or a restructure.

Expect requested changes on larger PRs, especially restructures. Have the Contributor role? Ask questions in `#general-contributor` on [Discord](https://discord.gg/uSM8tvTxBV).
