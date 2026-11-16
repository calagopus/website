// Search unmounts on close, so keep it around until it has animated out.
export function setupSearchClose(): void {
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node.matches('.VPLocalSearchBox:not(.closing)')) {
          for (const old of document.querySelectorAll('.VPLocalSearchBox.closing')) old.remove();
        }
      }

      for (const node of record.removedNodes) {
        if (!(node instanceof HTMLElement) || !node.matches('.VPLocalSearchBox:not(.closing)')) continue;

        node.inert = true;
        node.classList.add('closing');
        document.body.append(node);
        // Not the whole subtree, the loading spinner never finishes.
        const fades = [...node.children].flatMap((child) => child.getAnimations());
        void Promise.allSettled(fades.map((animation) => animation.finished)).then(() => node.remove());
      }
    }
  }).observe(document.body, { childList: true });
}
