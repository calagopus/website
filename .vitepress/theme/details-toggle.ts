// Animates `::: details` blocks and the expand/collapse all buttons.

const DURATION = 200;
const BLOCKS = '.vp-doc details.custom-block';
const animations = new WeakMap<HTMLDetailsElement, Animation>();

const isOpen = (details: HTMLDetailsElement) => details.open && !details.classList.contains('details-closing');

const groupDetails = (group: string) => [
  ...document.querySelectorAll<HTMLDetailsElement>(`details[data-details-group="${CSS.escape(group)}"]`),
];

const labelFor = (group: string) => (groupDetails(group).every(isOpen) ? 'Collapse all' : 'Expand all');

function animateTo(details: HTMLDetailsElement, open: boolean): void {
  if (isOpen(details) === open && !animations.has(details)) return;

  // Measure first so reversing mid-animation doesn't jump.
  const from = details.getBoundingClientRect().height;
  animations.get(details)?.cancel();
  animations.delete(details);
  details.classList.remove('details-closing');

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    details.open = open;
    return;
  }

  let to: number;
  if (open) {
    details.open = true;
    to = details.getBoundingClientRect().height;
  } else {
    details.classList.add('details-closing');
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    to = (summary?.offsetHeight ?? 0) + details.offsetHeight - details.clientHeight;
  }

  const animation = details.animate({ height: [`${from}px`, `${to}px`] }, { duration: DURATION, easing: 'ease' });
  animations.set(details, animation);
  animation.onfinish = () => {
    animations.delete(details);
    if (!open) {
      details.classList.remove('details-closing');
      details.open = false;
    }
  };
}

export function setupDetailsToggle(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;

    const button = target?.closest<HTMLButtonElement>('[data-details-toggle]');
    const group = button?.dataset.detailsToggle;
    if (button && group !== undefined) {
      const open = !groupDetails(group).every(isOpen);
      for (const details of groupDetails(group)) animateTo(details, open);
      button.textContent = open ? 'Collapse all' : 'Expand all';
      return;
    }

    const summary = target?.closest('summary');
    const details = summary?.parentElement;
    if (!(details instanceof HTMLDetailsElement) || !details.matches(BLOCKS)) return;
    if (summary !== details.querySelector(':scope > summary')) return;

    event.preventDefault();
    animateTo(details, !isOpen(details));
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
