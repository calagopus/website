![Calagopus Logo](https://calagopus.com/contributing-fullogo.svg)

# Overview

This repo powers the Calagopus website and documentation, built with [VitePress](https://vitepress.dev), currently on `v2.0.0-alpha.17`.

Expect occasional breaking changes between versions, check the [changelog](https://github.com/vuejs/vitepress/releases) if something breaks after an update.

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

## General Guidelines

Don't stress about following every rule perfectly or making everything look exactly the same.

The goal is mostly that changes stay readable, easy to review, and easy to understand later. Keep things consistent with what's already there where it makes sense, explain non-obvious changes, and leave enough context so someone else can immediately tell what changed and why.

Good structure and consistency > blindly following patterns.

## Sidebar

Keep `/.vitepress/config.mts` straightforward, minimal, and easy to navigate.

* Don't nest for a single page; only create groups when there are actually multiple related pages.
* When adding larger topics with multiple pages/folders, follow existing structures where possible instead of inventing a completely new layout.
* If something naturally fits a structure like `Migrations` with grouped pages and sub-groups, organize it similarly instead of dumping everything into one place.
* Keep names short and parallel across siblings (`Database Hosts`, not `Setting up Database Hosts`).
* Before creating a new top-level section, check whether the page already belongs somewhere existing.

This isn't meant to be followed perfectly, just keep things readable and easy to understand for whoever touches the docs next.

Unsure if a restructure is clean enough? Join our Discord and ask, or create an issue.

## Page & File Naming

Name files after their sidebar entry, not their H1. The two don't have to match.

Examples:

* Sidebar: `SSL Certificates`
  H1: `Generating an SSL Certificate`

* Sidebar: `Reverse Proxies`
  H1: `Setting up a Reverse Proxy`

Keeping filenames aligned with sidebar entries keeps `link:` paths predictable.

## Frontmatter

If a page already has frontmatter (`prev`, `next`, `title`, etc.), leave it alone. It's usually there on purpose.

Think something is wrong? Mention it in your PR description instead of changing it silently.

## Plugins & Dependencies

Adding a new plugin, package, or dependency?

Mention it in your PR description:

* what it does
* why it's needed

Undisclosed dependencies will probably get sent back.

Currently installed:

| Plugin                                | Purpose                                      | Docs                                                               |
| ------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `vite-plugin-image-optimizer`         | Optimizes images at build time               | [npm](https://www.npmjs.com/package/vite-plugin-image-optimizer)   |
| `vitepress-plugin-mermaid`            | Mermaid diagram support                      | [Docs](https://emersonbottero.github.io/vitepress-plugin-mermaid/) |
| `vitepress-plugin-tabs`               | Powers the `:::: tabs` syntax                | [Docs](https://vitepress-plugins.sapphi.red/tabs/)                 |
| `aiDocPlugin` (`./plugins/ai-doc.ts`) | Internal, intentionally undocumented, ignore | n/a                                                                |

## Commits & PRs

Write commit titles and PR descriptions like a person, not `fix` or `update docs`.

Titles should explain what changed.

Descriptions (when needed) should explain why, mention anything non-obvious (new dependency, breaking sidebar change, renamed page, restructuring, etc.), or give reviewers context.

No strict format required, just make sure someone reading history later can understand what happened without opening every file.

## Making Edits

* Don't touch commands, config values, or code blocks during wording/formatting passes. Technical content should stay byte-for-byte correct.
* Match the existing tone: direct, practical, no fluff.
* Multiple methods in one guide? Use the existing `:::: tabs` / `=== Method` pattern.
* Check internal links before opening a PR.
* Run the dev server locally and make sure:

  * no console errors
  * no dead links
  * no broken `link:` sidebar entries
  * no broken `[text](path.md)` references
  * etc.

## Questions

Already have the contributor role and got questions? Ask in Discord under `#general-contributor`.

https://discord.gg/uSM8tvTxBV
