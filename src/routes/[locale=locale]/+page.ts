import type { EntryGenerator } from './$types';

// 此文件用于静态站点生成 (SSG) 的预渲染配置。
// entries 函数负责告诉 SvelteKit 哪些 [locale] 是有效的，从而在构建时生成对应的首页 HTML。
export const entries: EntryGenerator = () => {
    // Vite 的 import.meta.glob 要求参数必须是字符串字面量（无法使用变量或 JSON 配置），
    // 因为它需要在编译时进行静态分析。显式限定目录可以显著提高构建性能并避免匹配错误。
    const files = import.meta.glob([
        '/docs/*/index.md',
        '/moments/*/index.md',
        '/blogs/*/index.md',
        '/news/*/index.md'
    ]);

    const localeSet = new Set<string>();
    for (const path in files) {
        const parts = path.split('/');
        // 路径拆分示例: ["", "docs", "zh", "index.md"] -> parts[2] 即为语言代码
        if (parts[2]) localeSet.add(parts[2]);
    }

    const result = Array.from(localeSet).map(locale => ({ locale }));
    return result.length > 0 ? result : [{ locale: 'en' }];
};
