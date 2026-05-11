import { setupI18n } from '$lib/i18n';
import type { LayoutLoad } from './$types';

// 这个 load 函数会在服务器端和客户端运行
export const load: LayoutLoad = async ({ params }) => {
    // 根据 URL 路径中的 [locale] 参数设置当前语言
    await setupI18n(params.locale);
    // 返回 locale 参数，以便子组件或页面可以使用它
    return { locale: params.locale };
};