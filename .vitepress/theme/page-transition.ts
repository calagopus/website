import type { Router } from 'vitepress';
import { nextTick, onMounted } from 'vue';

const clean = (path: string) => path.replace(/(\/index)?\.html$/, '').replace(/\/$/, '');
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = () => document.documentElement.classList;

// Opacity only, a transform on something this tall stutters.
const fadeIn = () =>
  document.querySelector('.VPContent')?.animate({ opacity: [0, 1] }, { duration: 200, easing: 'ease' });

const onScreen = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight;
};

const smoothFrame = () =>
  new Promise<void>((resolve) => {
    let start = 0;
    let last = 0;
    const tick = (now: number) => {
      start ||= now;
      if ((last && now - last < 50) || now - start > 300) return resolve();
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

export function useFirstLoadFade(): void {
  onMounted(async () => {
    const content = document.querySelector('.VPContent');
    const images = [...(content?.querySelectorAll('img') ?? [])].filter(onScreen);
    await Promise.race([
      Promise.allSettled(images.map((image) => image.decode())),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
    await smoothFrame();
    if (root().contains('content-ready')) return;

    const hidden = content && getComputedStyle(content).opacity === '0';
    root().add('content-ready');
    if (hidden && !reduced()) fadeIn();
  });
}

// The hook also fires for same-page #links.
export function setupPageTransition(router: Router): void {
  let current = clean(location.pathname);

  router.onAfterRouteChange = async (to) => {
    const path = clean(new URL(to, location.origin).pathname);
    if (path === current) return;
    current = path;
    root().add('content-ready');
    if (reduced()) return;

    await nextTick();
    fadeIn();
  };
}
