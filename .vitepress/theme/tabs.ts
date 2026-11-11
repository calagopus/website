// Slides the selected-tab underline between tabs.

const LISTS = '.vp-doc .plugin-tabs--tab-list, .vp-doc .vp-code-group .tabs';
const observed = new Set<HTMLElement>();
let frame = 0;

function place(list: HTMLElement): void {
  const tab = list.querySelector<HTMLElement>(':scope > [aria-selected="true"], :scope > input:checked + label');
  if (!tab || list.offsetParent === null) return;

  list.style.setProperty('--indicator-left', `${tab.offsetLeft}px`);
  list.style.setProperty('--indicator-width', `${tab.offsetWidth}px`);
  list.setAttribute('data-indicator', '');
}

function update(resize: ResizeObserver): void {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    for (const list of observed) {
      if (list.isConnected) continue;
      observed.delete(list);
      for (const element of [list, ...list.children]) resize.unobserve(element);
    }

    for (const list of document.querySelectorAll<HTMLElement>(LISTS)) {
      if (!observed.has(list)) {
        observed.add(list);
        // Full-width rows don't resize when fonts load, their tabs do.
        for (const element of [list, ...list.children]) resize.observe(element);
      }
      place(list);
    }
  });
}

export function setupTabIndicator(): void {
  const resize = new ResizeObserver(() => update(resize));
  new MutationObserver(() => update(resize)).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-selected'],
  });
  // Code group tabs are radios, so no attribute changes.
  document.addEventListener('change', () => update(resize));
  update(resize);
}
