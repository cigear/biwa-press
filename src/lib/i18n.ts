import { init, register, waitLocale } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));
register('zh', () => import('./locales/zh.json'));
register('ja', () => import('./locales/ja.json'));

export async function setupI18n(locale: string) {
    init({
        fallbackLocale: 'en',
        initialLocale: locale,
    });
    // 必须等待对应的语言包异步加载完成
    await waitLocale(locale);
}

