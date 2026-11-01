![Calagopus Logo](https://calagopus.com/banners/contributing-fullogo.svg)

# Contributing to the Calagopus Website & Docs

Thanks for taking the time to contribute. This repo powers the Calagopus website and documentation, built with [VitePress](https://vitepress.dev), currently on `v2.0.0-alpha.21`. Expect occasional breaking changes between VitePress versions. Check the [changelog](https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md) if something breaks after an update.

Don't stress about following every rule below perfectly or making everything look identical. The goal is that changes stay readable, easy to review, and easy to understand later. Keep things consistent with what's already there where it makes sense, and explain non-obvious changes.

## Before You Start

- For small fixes (typos, broken links, a missing detail, small wording passes), just open a PR.
- For anything larger, e.g. restructuring the sidebar, splitting or merging pages, adding a new top-level section, opening a PR directly is fine if you'd rather show the change than describe it first.
- For something genuinely big, e.g. reorganizing an entire section like Features, changing how the docs are structured overall, open an issue first or bring it up in [Discord](https://discord.gg/uSM8tvTxBV) before you start. This avoids wasted work if the change doesn't fit how the docs are organized.
- Not sure if a restructure is clean enough? Same rule: ask before you sink time into it.

## Getting Started

1. Clone the repo and `cd` into it:

```bash
git clone https://github.com/calagopus/website.git
cd website
```

2. Install dependencies:

```bash
pnpm i
```

3. Start the dev server:

```bash
pnpm docs:dev
```

This runs a live environment that updates automatically as you edit files.

## AI / LLM Usage

Using AI to draft or edit a page is fine here, unlike in the [panel repo](https://github.com/calagopus/panel/blob/main/CONTRIBUTING.md#ai--llm-usage), which doesn't accept AI-written code at all. Docs are different: a first draft is easier to review and fix than to write from scratch, as long as someone actually read and rewrote it before opening the PR.

- Submitting what a model produced without reading and rewriting it is not fine.
- No em dashes. Use a period, comma, or "and" instead.
- No filler phrases, no restating the obvious, no "in conclusion" or "it's worth noting that."
- No padded lists where three real points get stretched into ten bullets.
- Say the thing once, plainly, in the tone the rest of the docs already use.

If a reviewer can tell a page was AI-generated without checking git blame, it needs another pass. You're responsible for what you submit either way, AI or not, and should be able to explain any part of your change if asked.

## Making Changes

- Keep PRs focused. A PR should do one thing; unrelated changes make review harder and should be a separate PR.
- Match the existing tone: direct, practical, no fluff.
- Don't touch commands, config values, or code blocks during a wording or formatting pass. Technical content stays byte-for-byte correct.
- More than one method in a guide? Use [tabs](#tabs-and-dropdowns) instead of stacking headings.
- Commands that always run together belong in one code block, so readers can copy them in one go. Split a block only where the reader has to edit a file, check something or make a choice. Anything that prompts swallows the rest of a pasted block, so use `-y` and `--no-pager` in the middle of one.
- Commands use `sudo` on everything that needs root, and every `docker` command counts, since a default Docker install requires it. The exceptions are Alpine blocks, because Alpine doesn't ship `sudo`, and rootless guides.
- On a binary install, call the binary by its full path, like `sudo /usr/local/bin/wings`, because some distributions leave `/usr/local/bin` out of the path `sudo` uses.
- The Panel reads its `.env` from the current directory, so CLI commands on a binary or package install need `cd /etc/calagopus` first.
- Long code blocks, like full proxy configurations, go in a file under `web/snippets/` and get included with a [snippet import](https://vitepress.dev/guide/markdown#import-code-snippets), the way the reverse proxy guides do it: `<<< @/snippets/reverse-proxies/panel/nginx.conf{nginx}`

### Sidebar

The sidebar lives in `.vitepress/data/sidebar.ts`. Keep it straightforward, minimal, and easy to navigate.

- Don't nest for a single page. Only create a group when there are actually multiple related pages.
- Adding a larger topic with multiple pages or folders? Follow an existing structure instead of inventing a new layout. If something naturally fits a pattern like `Migrations` (grouped pages with sub-groups), organize it the same way rather than dumping everything in one place.
- Keep names short and parallel across siblings: `Database Hosts`, not `Setting up Database Hosts`.
- Before creating a new top-level section, check whether the page already belongs somewhere existing.
- A `link:` to a folder's `index.md` ends with a `/`, e.g. `/docs/panel/installation/`. Without it the page doesn't count as part of the sidebar, so it never gets highlighted and its previous and next links are wrong.

### Naming Pages and Files

Name a file after its sidebar entry, not its H1. The two don't have to match.

| Filename | Sidebar entry | H1 |
| --- | --- | --- |
| `additional/ssl-certificates.md` | `SSL Certificates` | Generating SSL Certificates |
| `panel/next-steps/reverse-proxy.md` | `Setting up a Reverse Proxy` | Putting the Panel Behind a Reverse Proxy |

Keeping filenames aligned with sidebar entries keeps `link:` paths predictable.

Moved or renamed a page? Old URLs aren't redirected, so update every link to it. `pnpm docs:build` fails on a link to a page that doesn't exist, but it doesn't check `#anchors`, so check those by hand.

### Frontmatter

Every page needs a `description`. The rest depends on the page.

| Key | When to set it |
| --- | --- |
| `description` | Always. Say what the page covers in plain words, ideally under 170 characters. Wrap it in double quotes if it contains `: `. |
| `title` | When the H1 isn't enough for a browser tab or search result, e.g. `Admin Settings` for a page whose H1 is `Settings`. Without it, the page uses its H1. |
| `prev` / `next` | Only as `false`, following the rule below. `true` does nothing, so don't add it. |

#### Previous and Next Links

Each top-level sidebar group (`About Calagopus`, `Panel`, `Wings`, `Compare`, and so on) is self-contained. The links at the bottom of a page stay inside its group:

- The first page in a group has `prev: false`.
- The last page in a group has `next: false`.
- A page that isn't in the sidebar, like the `/docs` landing page, has both. Without them, its next link goes to the first page in the sidebar.
- Every other page has neither.

Adding a page to the end of a group, or moving the last page? Move the `next: false` too, otherwise readers get a dead end in the middle of the group. `pnpm run check-frontmatter` tells you which pages need changing, and CI runs it too.

### Tabs and Dropdowns

Use tabs when the reader picks one option and ignores the rest: Docker or Standalone, nginx, Apache or Caddy.

```md
::::tabs
=== Docker

Docker steps.

=== Standalone

Standalone steps.

::::
```

Use a dropdown for something most readers can skip: a long example, an FAQ answer, steps only some people need.

```md
::: details Docker isn't installed yet
Install steps.
:::
```

Don't put required steps or warnings in a dropdown. People will miss them.

When nesting, the outer container needs more colons than the one inside it, or the inner closing marker closes both:

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

A link can't open a dropdown or switch to a tab. Point it at a heading outside them and name the dropdown or tab in the text, e.g. "see the **Docker isn't installed yet** dropdown below".

### Where Things Go

- Guides for setting up something around the Panel, Wings or DB Agent, like SSL or a reverse proxy, go in that component's `next-steps/` folder, with one `Docker` and one `Standalone` tab where both apply.
- Anything shared between components goes in `additional/`, e.g. getting a certificate in `additional/ssl-certificates.md`.
- Comparison pages in `compare/` have their own sidebar and follow the same order: summary, which to choose, performance or architecture, features, where each side is stronger, migrating. Say where the other project is the better choice. FAQ answers live in `.vitepress/data/compare-faqs.ts`, and `<CompareFaq />` shows them at the end of the page. Use `<Yes />` and `<No />` in feature tables instead of emoji, and give new pages the same `pageClass` as the existing ones.

### Generated Pages

Some pages get their content from somewhere else, so edit the source instead. On the configuration pages, every option shows an **Optional** tag unless you give it `required: true`, and only do that if the software can't run without it.

| Page | Edit this instead |
| --- | --- |
| `wings/configuration.md` | `.vitepress/data/config/wings.ts` |
| `db-agent/configuration.md` | `.vitepress/data/config/db-agent.ts` |
| `releases/panel.md`, `releases/wings.md`, `releases/db-agent.md` | The changelogs come from each project's GitHub releases. Extra notes go in `.vitepress/data/release-notes.ts`. |

### Plugins & Dependencies

Adding a new plugin, package, or dependency? Say what it does and why it's needed in your PR description. Undisclosed dependencies will probably get sent back.

Currently installed:

| Plugin | Purpose | Docs |
| ------ | ------- | ---- |
| `vite-imagetools`                     | Converts imported PNG and JPEG images to WebP and caps images at 1600px wide | [Repo](https://github.com/JonasKruckenberg/imagetools)             |
| `vite-plugin-image-optimizer`         | Compresses PNG, JPEG and SVG images at build time, skipping WebP             | [npm](https://www.npmjs.com/package/vite-plugin-image-optimizer)   |
| `vitepress-plugin-mermaid`            | Mermaid diagram support                                                      | [Docs](https://emersonbottero.github.io/vitepress-plugin-mermaid/) |
| `vitepress-plugin-tabs`               | Powers the `:::: tabs` syntax                                                | [Docs](https://vitepress-plugins.sapphi.red/tabs/)                 |
| `aiDocPlugin` (`./plugins/ai-doc.ts`) | Internal, intentionally undocumented, ignore                                 | n/a                                                                |

The click-to-zoom image viewer is not a plugin. It lives in `.vitepress/components/ImageViewer.vue`.

## Before Opening a PR

Run the same checks CI runs:

```bash
pnpm run biome:validate
pnpm run typecheck
pnpm run check-frontmatter
pnpm docs:build
pnpm run check-worker-routes
pnpm exec wrangler deploy --dry-run
```

If `biome:validate` reports dozens of unrelated files needing reformatting, it's almost certainly CRLF line endings from a Windows checkout, not a real issue. A `.gitattributes` in the repo root forces LF on checkout, but it only applies to files checked out *after* it's in place. If you cloned before it existed, run `git add --renormalize .` once (and `git config core.autocrlf false` if you have it set globally), then re-run the check.

Then confirm in the dev server:

- no console errors
- no dead links
- no broken `link:` sidebar entries
- no broken `[text](path.md)` references

## Commit Messages & PR Description

Write commit titles and PR descriptions like a person, not `fix` or `update docs`. A title should say what changed.

A description, when you need one, should explain why, call out anything non-obvious (new dependency, breaking sidebar change, renamed page, restructuring, etc.), and give reviewers enough context to follow along. No strict format required, just make sure someone reading the history later can understand what happened without opening every file.

## Review

A maintainer will review your PR. Expect requested changes on first pass for larger contributions, especially restructures.

Already have the Contributor role? Ask your questions in our [Discord](https://discord.gg/uSM8tvTxBV) in the `#general-contributor` channel.
