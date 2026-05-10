import type { EntryGenerator } from './[locale]/$types';

// 建议：通过 import.meta.glob 扫描 docs 文件夹下的目录来动态获取语言
export const entries: EntryGenerator = () => {
    const docs = import.meta.glob('/docs/*/index.md'); // 假设结构是 /docs/zh/post.md
    const locales = Object.keys(docs).map(path => {
        const parts = path.split('/');
        return { locale: parts[2] };
    });
    return locales.length > 0 ? locales : [{ locale: 'en' }];
};
