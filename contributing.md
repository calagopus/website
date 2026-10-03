![Calagopus Logo](https://calagopus.com/banners/contributing-fullogo.svg)

# Contributing to the Calagopus Website & Docs

Thanks for taking the time to contribute. This repo powers the Calagopus website and documentation, built with [VitePress](https://vitepress.dev), currently on `v2.0.0-alpha.20`. Expect occasional breaking changes between VitePress versions. Check the [changelog](https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md) if something breaks after an update.

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
- More than one method in a guide? Use the existing `:::: tabs` / `=== Method` pattern instead of stacking headings.
- Long code blocks, like full proxy configurations, go in a file under `web/snippets/` and get included with a [snippet import](https://vitepress.dev/guide/markdown#import-code-snippets), the way the reverse proxy guides do it: `<<< @/snippets/reverse-proxies/panel/nginx.conf{nginx}`

### Sidebar

Keep `.vitepress/config.mts` straightforward, minimal, and easy to navigate.

- Don't nest for a single page. Only create a group when there are actually multiple related pages.
- Adding a larger topic with multiple pages or folders? Follow an existing structure instead of inventing a new layout. If something naturally fits a pattern like `Migrations` (grouped pages with sub-groups), organize it the same way rather than dumping everything in one place.
- Keep names short and parallel across siblings: `Database Hosts`, not `Setting up Database Hosts`.
- Before creating a new top-level section, check whether the page already belongs somewhere existing.

### Naming Pages and Files

Name a file after its sidebar entry, not its H1. The two don't have to match.

| Filename | Sidebar entry | H1 |
| --- | --- | --- |
| `ssl-certificates.md` | `SSL Certificates` | Generating SSL Certificates |
| `reverse-proxies/panel.md` | `Panel` | Putting the Panel Behind a Reverse Proxy |

Keeping filenames aligned with sidebar entries keeps `link:` paths predictable.

### Frontmatter

If a page already has frontmatter (`prev`, `next`, `title`, etc.), leave it alone. It's usually there on purpose.

Think something is wrong with it? Mention it in your PR description instead of changing it silently.

### Plugins & Dependencies

Adding a new plugin, package, or dependency? Say what it does and why it's needed in your PR description. Undisclosed dependencies will probably get sent back.

Currently installed:

| Plugin | Purpose | Docs |
| ------ | ------- | ---- |
| `vite-plugin-image-optimizer`         | Optimizes images at build time               | [npm](https://www.npmjs.com/package/vite-plugin-image-optimizer)   |
| `vitepress-plugin-mermaid`            | Mermaid diagram support                      | [Docs](https://emersonbottero.github.io/vitepress-plugin-mermaid/) |
| `vitepress-plugin-tabs`               | Powers the `:::: tabs` syntax                | [Docs](https://vitepress-plugins.sapphi.red/tabs/)                 |
| `vitepress-plugin-viewerjs`           | Click-to-zoom lightbox for images            | [Repo](https://github.com/Lovinoes/vitepress-plugin-viewerjs)      |
| `aiDocPlugin` (`./plugins/ai-doc.ts`) | Internal, intentionally undocumented, ignore | n/a                                                                |

## Before Opening a PR

Run the same checks CI runs:

```bash
pnpm docs:build
pnpm exec biome check
pnpm run typecheck
```

If `biome check` reports dozens of unrelated files needing reformatting, it's almost certainly CRLF line endings from a Windows checkout, not a real issue. A `.gitattributes` in the repo root forces LF on checkout, but it only applies to files checked out *after* it's in place. If you cloned before it existed, run `git add --renormalize .` once (and `git config core.autocrlf false` if you have it set globally), then re-run the check.

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
