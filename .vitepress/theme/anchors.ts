import { useRoute } from 'vitepress';
import { defineComponent, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { anchorsInTabs, movedAnchors } from '../data/moved-anchors.ts';

function currentAnchor(): string {
  try {
    return decodeURIComponent(location.hash.slice(1));
  } catch {
    return '';
  }
}

function tabButton(label: string, tabs: Element | null = document.querySelector('.plugin-tabs')) {
  return [...(tabs?.querySelectorAll<HTMLElement>('.plugin-tabs--tab') ?? [])].find((tab) => tab.textContent === label);
}

// Opens the tab an anchor is in. Closed tabs aren't in the DOM until then.
async function openTabWith(id: string, page: string): Promise<HTMLElement | null> {
  const label = Object.entries(anchorsInTabs[page] ?? {}).find(([, anchors]) => anchors.includes(id))?.[0];
  if (label) {
    const button = tabButton(label);
    button?.click();
    return button ?? null;
  }

  for (const tabs of document.querySelectorAll<HTMLElement>('.plugin-tabs[data-anchors]')) {
    const anchors = JSON.parse(tabs.dataset.anchors ?? '{}');
    if (!Object.hasOwn(anchors, id)) continue;

    tabButton(anchors[id], tabs)?.click();
    await nextTick();
    return document.getElementById(id);
  }
  return null;
}

// Takes a link to its section when the browser can't: the section was renamed,
// or it's in a closed tab or dropdown.
async function revealAnchor(page: string) {
  const anchor = currentAnchor();
  if (!anchor) return;

  const moved = movedAnchors[page]?.[anchor];
  const id = typeof moved === 'string' ? moved : anchor;
  const position = () => document.getElementById(id)?.getBoundingClientRect().top;

  // Tabs restore the visitor's last choice right after mounting, which can add
  // the target or move it after the browser already scrolled.
  const before = position();
  await nextTick();

  const visible = document.getElementById(id);
  const target = visible ?? (await openTabWith(id, page));
  if (!target) return;

  let changed = !visible || position() !== before;

  if (id !== anchor) {
    history.replaceState(history.state, '', `${location.pathname}${location.search}#${id}`);
    changed = true;
  }

  for (let details = target.closest('details'); details; details = details.parentElement?.closest('details') ?? null) {
    if (details.open) continue;
    details.open = true;
    changed = true;
  }

  if (changed) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}

function useAnchorHandler() {
  const route = useRoute();
  const reveal = () => void revealAnchor(route.path.replace(/\/$/, ''));

  onMounted(() => {
    reveal();
    window.addEventListener('hashchange', reveal);
  });
  onUnmounted(() => window.removeEventListener('hashchange', reveal));
  watch(() => route.path, reveal, { flush: 'post' });

  return () => null;
}

export const AnchorHandler = defineComponent({ setup: useAnchorHandler });
