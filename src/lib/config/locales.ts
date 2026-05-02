export const defaultLocale = 'en';

export const locales = {
  en: {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
    title: 'Biwa Press',
    description: 'A VitePress-like docs framework powered by SvelteKit.',
    getStarted: 'Get Started',
    configuration: 'Configuration',
    search: 'Search',
    searchTitle: 'Search docs',
    searchPlaceholder: 'Type to search...',
    searchHint: 'Search titles, descriptions, and page content.',
    searchNoResults: 'No results found.',
    eyebrow: 'SvelteKit docs framework starter',
    headline: 'Markdown to beautiful SvelteKit docs.',
    intro:
      'Build a VitePress-like documentation site with SvelteKit, Tailwind CSS 4, Bits UI, mdsvex, and static output.'
  },
  zh: {
    code: 'zh',
    label: '中文',
    shortLabel: '中',
    title: 'Biwa Press',
    description: '基于 SvelteKit 的类 VitePress 文档框架。',
    getStarted: '快速开始',
    configuration: '配置',
    search: '搜索',
    searchTitle: '搜索文档',
    searchPlaceholder: '输入关键词...',
    searchHint: '搜索标题、描述和页面正文。',
    searchNoResults: '没有找到结果。',
    eyebrow: 'SvelteKit 文档框架起点',
    headline: '用 Markdown 构建漂亮的 SvelteKit 文档。',
    intro:
      '使用 SvelteKit、Tailwind CSS 4、Bits UI、mdsvex 和静态输出，构建一个类似 VitePress 的文档站。'
  },
  ja: {
    code: 'ja',
    label: '日本語',
    shortLabel: '日',
    title: 'Biwa Press',
    description: 'SvelteKit で作る VitePress 風ドキュメントフレームワーク。',
    getStarted: 'はじめる',
    configuration: '設定',
    search: '検索',
    searchTitle: 'ドキュメントを検索',
    searchPlaceholder: 'キーワードを入力...',
    searchHint: 'タイトル、説明、本文を検索します。',
    searchNoResults: '結果が見つかりません。',
    eyebrow: 'SvelteKit ドキュメントフレームワークのスターター',
    headline: 'Markdown から美しい SvelteKit ドキュメントへ。',
    intro:
      'SvelteKit、Tailwind CSS 4、Bits UI、mdsvex、静的出力で、VitePress のようなドキュメントサイトを構築します。'
  }
} as const;

export type Locale = keyof typeof locales;

export function isLocale(locale: string): locale is Locale {
  return locale in locales;
}

export function getLocaleConfig(locale: Locale) {
  return locales[locale];
}
