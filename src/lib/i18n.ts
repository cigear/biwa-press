import { init, register, waitLocale, getLocaleFromNavigator, locale } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));
register('zh', () => import('./locales/zh.json'));
register('ja', () => import('./locales/ja.json'));

init({
    fallbackLocale: 'en',
    initialLocale: getLocaleFromNavigator() || 'en',
});

export async function setupI18n(lang: string) {
    locale.set(lang);
    // 必须等待对应的语言包异步加载完成
    await waitLocale(lang);
}
