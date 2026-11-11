import type { Router } from 'vitepress';

const clean = (path: string) => path.replace(/(\/index)?\.html$/, '').replace(/\/$/, '');

// Fades content in on page changes. The hook also fires for same-page #links.
export function setupPageTransition(router: Router): void {
  let current = clean(location.pathname);

  router.onAfterRouteChange = (to) => {
    const path = clean(new URL(to, location.origin).pathname);
    if (path === current) return;
    current = path;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    requestAnimationFrame(() => {
      document.querySelector('.VPContent .vp-doc')?.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 200, easing: 'ease' },
      );
    });
  };
}
