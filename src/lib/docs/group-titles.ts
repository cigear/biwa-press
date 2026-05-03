import type { Locale } from '$lib/config/locales';

export const GROUP_TITLES: Record<string, Record<Locale, string>> = {
  home: {
    en: 'Home',
    zh: '首页',
    ja: 'ホーム'
  },
  guide: {
    en: 'Guide',
    zh: '指南',
    ja: 'ガイド'
  },
  configuration: {
    en: 'Configuration',
    zh: '配置',
    ja: '設定'
  },
  advanced: {
    en: 'Advanced',
    zh: '高级',
    ja: '上級'
  }
  // 你可以继续添加更多目录
};
