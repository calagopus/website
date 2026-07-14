![Calagopus Logo](https://calagopus.com/banners/contributing-fullogo.svg)

# Contributing

This repo powers the Calagopus website and documentation, built with [VitePress](https://vitepress.dev), currently on `v2.0.0-alpha.18`. Expect occasional breaking changes between VitePress versions. Check the [changelog](https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md) if something breaks after an update.

> This page is still a **work in progress**.

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

## Philosophy

Don't stress about following every rule below perfectly or making everything look identical. The goal is that changes stay readable, easy to review, and easy to understand later.

Keep things consistent with what's already there where it makes sense, explain non-obvious changes, and leave enough context so someone else can immediately tell what changed and why. Good structure and consistency beat blindly following a pattern.

## Sidebar

Keep `.vitepress/config.mts` straightforward, minimal, and easy to navigate.

- Don't nest for a single page. Only create a group when there are actually multiple related pages.
- Adding a larger topic with multiple pages or folders? Follow an existing structure instead of inventing a new layout. If something naturally fits a pattern like `Migrations` (grouped pages with sub-groups), organize it the same way rather than dumping everything in one place.
- Keep names short and parallel across siblings: `Database Hosts`, not `Setting up Database Hosts`.
- Before creating a new top-level section, check whether the page already belongs somewhere existing.

Not sure if a restructure is clean enough? Ask us in our [Discord](https://discord.gg/uSM8tvTxBV) or open an issue before you sink time into it.

## Naming Pages and Files

Name a file after its sidebar entry, not its H1. The two don't have to match.

| Filename              | Sidebar entry      | H1                          |
| --------------------- | ------------------ | --------------------------- |
| `ssl-certificates.md` | `SSL Certificates` | Generating SSL Certificates |
| `reverse-proxies.md`  | `Reverse Proxies`  | Setting up a Reverse Proxy  |

Keeping filenames aligned with sidebar entries keeps `link:` paths predictable.

## Frontmatter

If a page already has frontmatter (`prev`, `next`, `title`, etc.), leave it alone. It's usually there on purpose.

Think something is wrong with it? Mention it in your PR description instead of changing it silently.

## Plugins & Dependencies

Adding a new plugin, package, or dependency? Say what it does and why it's needed in your PR description. Undisclosed dependencies will probably get sent back.

Currently installed:

| Plugin                                | Purpose                                      | Docs                                                               |
| ------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `vite-plugin-image-optimizer`         | Optimizes images at build time               | [npm](https://www.npmjs.com/package/vite-plugin-image-optimizer)   |
| `vitepress-plugin-mermaid`            | Mermaid diagram support                      | [Docs](https://emersonbottero.github.io/vitepress-plugin-mermaid/) |
| `vitepress-plugin-tabs`               | Powers the `:::: tabs` syntax                | [Docs](https://vitepress-plugins.sapphi.red/tabs/)                 |
| `aiDocPlugin` (`./plugins/ai-doc.ts`) | Internal, intentionally undocumented, ignore | n/a                                                                |

## Commits & PRs

Write commit titles and PR descriptions like a person, not `fix` or `update docs`. A title should say what changed.

A description, when you need one, should explain why, call out anything non-obvious (new dependency, breaking sidebar change, renamed page, restructuring, etc.), and give reviewers enough context to follow along. No strict format required, just make sure someone reading the history later can understand what happened without opening every file.

## Making Edits

- Don't touch commands, config values, or code blocks during a wording or formatting pass. Technical content stays byte-for-byte correct.
- Match the existing tone: direct, practical, no fluff.
- More than one method in a guide? Use the existing `:::: tabs` / `=== Method` pattern instead of stacking headings.

Before opening a PR, run the dev server locally and confirm:

- no console errors
- no dead links
- no broken `link:` sidebar entries
- no broken `[text](path.md)` references

## AI-Assisted Contributions

Using AI to draft or edit a page is fine. Submitting what it produced without reading and rewriting it is not.

Before opening a PR, go through the text and fix anything that reads like it wasn't written by a person:

- No em dashes. Use a period, comma, or "and" instead.
- No filler phrases, no restating the obvious, no "in conclusion" or "it's worth noting that."
- No padded lists where three real points get stretched into ten bullets.
- Say the thing once, plainly, in the tone the rest of the docs already use.

If a reviewer can tell a page was AI-generated without checking git blame, it needs another pass. You're responsible for what you submit either way, AI or not.

## Questions

Already have the Contributor role? Ask your questions in our [Discord](https://discord.gg/uSM8tvTxBV) in the `#general-contributor` channel.
