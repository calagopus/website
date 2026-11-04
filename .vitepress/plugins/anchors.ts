import type { MarkdownRenderer } from 'vitepress';

// Same steps as the heading slugs from @mdit-vue/shared, which VitePress doesn't export.
const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: matches the upstream slug
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();

// Makes every anchor reachable from a link. Dropdowns get the id a heading with
// the same title would get. Closed tabs aren't in the DOM, so each tab set lists
// the anchors in its tabs for `theme/anchors.ts` to open the right one.
export function anchorsPlugin(md: MarkdownRenderer): void {
  md.core.ruler.push('anchors', (state) => {
    const used = new Set(state.tokens.flatMap((token) => (token.type === 'heading_open' ? [token.attrGet('id')] : [])));
    let tabs: (typeof state.tokens)[number] | undefined;
    let tab = '';

    for (const token of state.tokens) {
      if (token.type === 'container_details_open') {
        const slug = slugify(
          token.info
            .trim()
            .slice('details'.length)
            .replace(/\{[^}]*\}\s*$/, ''),
        );
        if (slug) {
          let id = slug;
          for (let n = 1; used.has(id); n++) id = `${slug}-${n}`;
          used.add(id);
          token.attrSet('id', id);
        }
      }

      if (token.type === 'container_tabs_open') {
        tabs = token;
        tabs.meta = {};
      } else if (token.type === 'container_tabs_close') {
        tabs = undefined;
      } else if (token.type === 'tab_open') {
        tab = token.info;
      } else if (tabs && token.attrGet('id') !== null && /^(heading_open|container_details_open)$/.test(token.type)) {
        tabs.meta[token.attrGet('id') as string] = tab;
      }
    }
  });

  const renderTabs = md.renderer.rules.container_tabs_open;
  if (!renderTabs) throw new Error('anchorsPlugin has to run after tabsMarkdownPlugin');

  md.renderer.rules.container_tabs_open = (tokens, index, options, env, self) => {
    const anchors = md.utils.escapeHtml(JSON.stringify(tokens[index].meta));
    return renderTabs(tokens, index, options, env, self).replace(
      '<PluginTabs',
      () => `<PluginTabs data-anchors="${anchors}"`,
    );
  };
}
