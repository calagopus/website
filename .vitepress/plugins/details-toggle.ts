import type { MarkdownRenderer } from 'vitepress';

type Token = ReturnType<MarkdownRenderer['parse']>[number];

const isOpen = (token: Token) => token.attrGet('open') !== null || /\{[^}]*\bopen\b[^}]*\}\s*$/.test(token.info);

// Expand/collapse all button under headings with 2+ `::: details` blocks outside tabs.
export function detailsTogglePlugin(md: MarkdownRenderer): void {
  md.core.ruler.push('details-toggle', (state) => {
    const groups: { heading: number; details: Token[] }[] = [];
    let depth = 0;
    let tabs = 0;

    state.tokens.forEach((token, index) => {
      if (token.type === 'heading_open' && token.tag !== 'h1') {
        groups.push({ heading: index, details: [] });
      } else if (token.type === 'container_tabs_open') {
        tabs++;
      } else if (token.type === 'container_tabs_close') {
        tabs--;
      } else if (token.type === 'container_details_open') {
        if (depth === 0 && tabs === 0) groups.at(-1)?.details.push(token);
        depth++;
      } else if (token.type === 'container_details_close') {
        depth--;
      }
    });

    groups.forEach((group, number) => {
      if (group.details.length < 2) return;
      for (const details of group.details) details.attrSet('data-details-group', String(number));
    });

    // Insert from the end so the indexes stay valid.
    for (const [number, group] of [...groups.entries()].reverse()) {
      if (group.details.length < 2) continue;

      const label = group.details.every(isOpen) ? 'Collapse all' : 'Expand all';
      const button = new state.Token('html_block', '', 0);
      button.content = `<div class="details-toggle"><button type="button" data-details-toggle="${number}">${label}</button></div>\n`;
      state.tokens.splice(group.heading + 3, 0, button);
    }
  });
}
