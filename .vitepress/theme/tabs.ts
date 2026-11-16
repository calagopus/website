// Slides the selected-tab underline between tabs.

const LISTS = '.vp-doc .plugin-tabs--tab-list, .vp-doc .vp-code-group .tabs';
const observed = new Set<HTMLElement>();
let frame = 0;

type Spot = [list: HTMLElement, left: number, bottom: number, width: number];

function measure(list: HTMLElement): Spot | undefined {
  const tab = list.querySelector<HTMLElement>(':scope > [aria-selected="true"], :scope > input:checked + label');
  if (!tab || list.offsetParent === null) return;
  return [list, tab.offsetLeft, tab.offsetTop + tab.offsetHeight - list.clientHeight, tab.offsetWidth];
}

function place([list, left, bottom, width]: Spot): void {
  list.style.setProperty('--indicator-left', `${left}px`);
  list.style.setProperty('--indicator-bottom', `${bottom}px`);
  list.style.setProperty('--indicator-width', `${width}`);
  list.setAttribute('data-indicator', '');
}

function fitRows(lists: HTMLElement[]): void {
  const rows = lists.filter((list) => list.matches('.plugin-tabs--tab-list'));
  for (const row of rows) row.removeAttribute('data-wrap');
  const tooWide = rows.filter((row) => row.scrollWidth > row.clientWidth + 1);
  for (const row of tooWide) row.setAttribute('data-wrap', '');
}

function update(resize: ResizeObserver): void {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    for (const list of observed) {
      if (list.isConnected) continue;
      observed.delete(list);
      for (const element of [list, ...list.children]) resize.unobserve(element);
    }

    const lists = [...document.querySelectorAll<HTMLElement>(LISTS)];
    for (const list of lists) {
      if (observed.has(list)) continue;
      observed.add(list);
      // Full-width rows don't resize when fonts load, their tabs do.
      for (const element of [list, ...list.children]) resize.observe(element);
    }

    fitRows(lists);
    for (const spot of lists.map(measure)) if (spot) place(spot);
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
