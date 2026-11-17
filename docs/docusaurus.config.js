import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('../package.json', 'utf8'));

// Replace @VERSION in code blocks with the xeus-runner version.
const replaceVersion = () => (tree) => {
  const walk = (node) => {
    if (node.type === 'code') {
      node.value = node.value.replaceAll('@VERSION', `@${version}`);
    }
    node.children?.forEach(walk);
  };
  walk(tree);
};

export default {
  title: 'xeus-runner',
  tagline: 'Run xeus WebAssembly kernels in TypeScript/JavaScript outside of JupyterLite',
  url: process.env.READTHEDOCS_CANONICAL_URL
    ? new URL(process.env.READTHEDOCS_CANONICAL_URL).origin
    : 'https://xeus-runner.readthedocs.io',
  baseUrl: process.env.READTHEDOCS_CANONICAL_URL
    ? new URL(process.env.READTHEDOCS_CANONICAL_URL).pathname
    : '/',
  future: {
    v4: true,
    faster: true,
  },
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
        readme: 'none',
        name: 'xeus-runner',
        pageTitleTemplates: { index: 'API' },
        categorizeByGroup: false,
        sort: ['alphabetical-ignoring-documents'],
        categoryOrder: ['Kernel', 'Helpers', 'Message handlers', 'Loggers', 'Bridges'],
        defaultCategory: 'Kernel',
        navigation: { includeCategories: true, includeGroups: false },
      },
    ],
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          remarkPlugins: [replaceVersion],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'xeus-runner',
      items: [
        {
          href: 'https://github.com/xeus-runner/xeus-runner',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
  },
};
