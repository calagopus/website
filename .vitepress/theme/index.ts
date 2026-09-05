// https://vitepress.dev/guide/custom-theme

import { createHead } from '@unhead/vue/client';
import { inBrowser, type Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import useImageViewer from 'vitepress-plugin-viewerjs';
import { h } from 'vue';
import CompareFaq from '../components/CompareFaq.vue';
import FeatureTable from '../components/FeatureTable.vue';
import { registerWebMcpTools } from './webmcp.ts';

import 'viewerjs/dist/viewer.css';
import './colors.css';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app, router, siteData }) {
    enhanceAppWithTabs(app);
    app.use(createHead());
    app.component('CompareFaq', CompareFaq);
    app.component('FeatureTable', FeatureTable);
    if (inBrowser) void registerWebMcpTools();
  },
  setup() {
    // biome-ignore lint/correctness/useHookAtTopLevel: React rule; the VitePress theme setup() is the Vue composition context
    useImageViewer();
  },
} satisfies Theme;
