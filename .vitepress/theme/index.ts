// https://vitepress.dev/guide/custom-theme

import { createHead } from '@unhead/vue/client';
import { inBrowser, type Theme, useData } from 'vitepress';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import CompareFaq from '../components/CompareFaq.vue';
import CompareSidebarLinks from '../components/CompareSidebarLinks.vue';
import FeatureMark from '../components/FeatureMark.vue';
import FeatureTable from '../components/FeatureTable.vue';
import ImageViewer from '../components/ImageViewer.vue';
import { AnchorHandler } from './anchors.ts';
import { createAppearanceToggle } from './appearance.ts';
import { setupDetailsToggle } from './details-toggle.ts';
import { setupPageTransition, useFirstLoadFade } from './page-transition.ts';
import { setupSearchClose } from './search.ts';
import { setupTabIndicator } from './tabs.ts';
import { registerWebMcpTools } from './webmcp.ts';
import './colors.css';
import './mantine.css';
import './components.css';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'layout-bottom': () => [h(ImageViewer), h(AnchorHandler)],
      'sidebar-nav-after': () => h(CompareSidebarLinks),
    });
  },
  setup() {
    useFirstLoadFade();
  },
  enhanceApp({ app, router }) {
    enhanceAppWithTabs(app);
    app.use(createHead());
    app.component('CompareFaq', CompareFaq);
    app.component('Yes', () => h(FeatureMark, { value: true }));
    app.component('No', () => h(FeatureMark, { value: false }));
    app.component('FeatureTable', FeatureTable);
    if (inBrowser) {
      app.provide('toggle-appearance', createAppearanceToggle(app.runWithContext(() => useData().isDark)));
      void registerWebMcpTools();
      setupDetailsToggle();
      setupTabIndicator();
      setupPageTransition(router);
      setupSearchClose();
    }
  },
} satisfies Theme;
