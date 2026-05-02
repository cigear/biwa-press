export const prerender = true;

import { setupI18n } from '$lib/i18n';
import type { LayoutLoad, EntryGenerator } from './$types';

export const load: LayoutLoad = async ({ params }) => {
    const { locale } = params;

    // 在服务端渲染组件之前，先初始化并加载语言包
    await setupI18n(locale);
    return { 
        locale 
    };
};
