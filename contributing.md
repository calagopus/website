![Calagopus Logo](https://calagopus.com/contributing-fullogo.svg)

# Overview
This repo powers the Calagopus website and documentation, built with [VitePress](https://vitepress.dev), currently on `v2.0.0-alpha.17`. Expect occasional breaking changes between versions, check the [changelog](https://github.com/vuejs/vitepress/releases) if something breaks after an update.

> this page is still W.I.P

## Local Development
1. Clone the repo and `cd` into it:
```bash
git clone https://github.com/calagopus/calagopus.git
cd calagopus
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

## Sidebar
Keep `/.vitepress/config.mts` straightforward, minimal, and clean:

- Don't nest for a single page; only group when there are actually multiple related pages.
- Use groups and sub-groups to organize related pages, like `Migrations` containing `From another Panel` and `To another Instance`, instead of just dumping everything.
- Names should be short and parallel across siblings (`Database Hosts`, not `Setting up Database Hosts`).
- Check if a new page belongs inside an existing section before adding a new top-level one.

Unsure if a restructure is clean enough? Either join our [Discord Server](https://discord.gg/uSM8tvTxBV) and ask, or create a Issue.

## Page & File Naming
Name every file after its sidebar entry, not its H1, the two don't have to match. A page titled "Generating an SSL Certificate" can sit under a sidebar entry called `SSL Certificates`, and a sidebar entry called `Reverse Proxy` can have an H1 like "Setting up a Reverse Proxy". 

Just keep the filename matching the sidebar name so `link:` paths stay predictable.

## Frontmatter
If a page already has frontmatter (`prev`, `next`, `title`, etc.), leave it alone! It's there on purpose. Think it's wrong? Flag it in your PR description and don't change it silently.

## Plugins & Dependencies
Adding a new plugin/package/dependency? Mention it in your PR description, what it's for and why. Undisclosed dependencies get sent back.

Currently installed:

| Plugin | Purpose | Docs |
|---|---|---|
| `vite-plugin-image-optimizer` | Optimizes images at build time | [npm](https://www.npmjs.com/package/vite-plugin-image-optimizer) |
| `vitepress-plugin-mermaid` | Mermaid diagram support | [Docs](https://emersonbottero.github.io/vitepress-plugin-mermaid/) |
| `vitepress-plugin-tabs` | Powers the `:::: tabs` syntax | [Docs](https://vitepress-plugins.sapphi.red/tabs/) |
| `aiDocPlugin` (`./plugins/ai-doc.ts`) | Internal, intentionally undocumented, ignore | n/a |

## Commit Messages
Write titles/descriptions like a person, not `fix` or `update docs`. Title says what changed; description (if needed) says why, or flags anything non-obvious (new dependency, breaking sidebar change, renamed page). Enough detail that a future revert makes sense to whoever's reading it.

## Making Edits
- Don't touch commands, config values, or code blocks during a wording/formatting pass, technical content must stay byte-for-byte correct.
- Match existing tone: direct, practical, no fluff.
- Multiple methods in a guide? Use the existing `:::: tabs` / `=== Method` pattern.
- Check internal links actually resolve before opening a PR.
- Run the dev server locally before opening a PR, and make sure it builds with no console errors and no dead links (broken `link:` entries in the sidebar or broken `[text](path.md)` references in pages).

## Questions
If you already have the contributor role and have questions, ask in our Discord under `#general-contributor`.
<https://discord.gg/uSM8tvTxBV>