// Animates `::: details` blocks and the expand/collapse all buttons.

const DURATION = 200;
const BLOCKS = '.vp-doc details.custom-block';
const animations = new WeakMap<HTMLDetailsElement, Animation>();

const isOpen = (details: HTMLDetailsElement) => details.open && !details.classList.contains('details-closing');

const groupDetails = (group: string) => [
  ...document.querySelectorAll<HTMLDetailsElement>(`details[data-details-group="${CSS.escape(group)}"]`),
];

const labelFor = (group: string) => (groupDetails(group).every(isOpen) ? 'Collapse all' : 'Expand all');

function animateTo(blocks: HTMLDetailsElement[], open: boolean): void {
  blocks = blocks.filter((details) => isOpen(details) !== open);

  const from = blocks.map((details) => details.getBoundingClientRect().height);
  for (const details of blocks) {
    animations.get(details)?.cancel();
    animations.delete(details);
    details.classList.remove('details-closing');
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const details of blocks) details.open = open;
    return;
  }

  for (const details of blocks) {
    if (open) details.open = true;
    else details.classList.add('details-closing');
  }
  const to = blocks.map((details) => {
    if (open) return details.getBoundingClientRect().height;
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    return (summary?.offsetHeight ?? 0) + details.offsetHeight - details.clientHeight;
  });

  blocks.forEach((details, i) => {
    const animation = details.animate(
      { height: [`${from[i]}px`, `${to[i]}px`] },
      { duration: DURATION, easing: 'ease' },
    );
    animations.set(details, animation);
    animation.onfinish = () => {
      animations.delete(details);
      if (!open) {
        details.classList.remove('details-closing');
        details.open = false;
      }
    };
  });
}

export function setupDetailsToggle(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;

    const button = target?.closest<HTMLButtonElement>('[data-details-toggle]');
    const group = button?.dataset.detailsToggle;
    if (button && group !== undefined) {
      const open = !groupDetails(group).every(isOpen);
      animateTo(groupDetails(group), open);
      button.textContent = open ? 'Collapse all' : 'Expand all';
      return;
    }

    const summary = target?.closest('summary');
    const details = summary?.parentElement;
    if (!(details instanceof HTMLDetailsElement) || !details.matches(BLOCKS)) return;
    if (summary !== details.querySelector(':scope > summary')) return;
    if (target?.closest('a, button, input, select, textarea')?.closest('summary') === summary) return;

    event.preventDefault();
    animateTo([details], !isOpen(details));
  });

  // `toggle` doesn't bubble.
  document.addEventListener(
    'toggle',
    (event) => {
      const group = (event.target as HTMLElement).dataset?.detailsGroup;
      if (group === undefined) return;

      const button = document.querySelector<HTMLButtonElement>(`[data-details-toggle="${CSS.escape(group)}"]`);
      if (button) button.textContent = labelFor(group);
    },
    true,
  );
}
