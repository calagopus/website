// https://vitepress.dev/guide/custom-theme

import { createHead } from '@unhead/vue/client';
import { inBrowser, type Theme, useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import { h } from 'vue';
import CompareFaq from '../components/CompareFaq.vue';
import FeatureTable from '../components/FeatureTable.vue';
import ImageViewer from '../components/ImageViewer.vue';
import { createAppearanceToggle } from './appearance.ts';
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
      'layout-bottom': () => h(ImageViewer),
    });
  },
  enhanceApp({ app }) {
    enhanceAppWithTabs(app);
    app.use(createHead());
    app.component('CompareFaq', CompareFaq);
    app.component('FeatureTable', FeatureTable);
    if (inBrowser) {
      app.provide('toggle-appearance', createAppearanceToggle(app.runWithContext(() => useData().isDark)));
      void registerWebMcpTools();
    }
  },
} satisfies Theme;
