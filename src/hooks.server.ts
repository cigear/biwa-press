import type { Handle } from '@sveltejs/kit';
import { locales } from '$lib/config/locales'; // Import locales config
import { site } from '$lib/config/site';

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;
  const supportedLocaleCodes = Object.keys(locales);

  // 辅助函数：根据浏览器请求头获取最匹配的已支持语言
  const getPreferredLocale = () => {
    const acceptLanguage = event.request.headers.get('accept-language') || '';
    let locale = 'en'; // 默认回退语言
    if (acceptLanguage.includes('ja')) locale = 'ja';
    else if (acceptLanguage.includes('zh')) locale = 'zh';
    
    return supportedLocaleCodes.includes(locale) ? locale : 'en';
  };

  // 当用户访问根路径 / 时，根据浏览器语言自动重定向
  if (pathname === '/') {
    const locale = getPreferredLocale();

    return new Response(null, {
      status: 307,
      headers: { location: `/${locale}` }
    });
  }

  // 2. Check if the locale in the URL is valid for /<locale>/... paths
  const pathParts = pathname.split('/');
  const urlLocale = pathParts.length > 1 ? pathParts[1] : null;
  // 核心修复：只对明确要求 HTML 的浏览器导航请求进行页面逻辑处理
  const isPageRequest = event.request.headers.get('accept')?.includes('text/html');

  // 逻辑修正：如果第一个路径段既不是语言代码，也不是集合名称，才进行首页重定向
  if (urlLocale && 
      !supportedLocaleCodes.includes(urlLocale) && 
      !site.collections.includes(urlLocale) && 
      isPageRequest) {
    const locale = getPreferredLocale();
    return new Response(null, {
      status: 302,
      headers: { location: `/${locale}` }
    });
  }

  // Resolve the request first
  const response = await resolve(event, {
    // 确保 app.html 里的 %sveltekit.lang% 被替换为 URL 中的实际语言
    transformPageChunk: ({ html }) => 
      html.replace('%sveltekit.lang%', event.params.locale || 'en')
  });

  // 3. 处理 404 错误
  // 重点修复：检查 Accept 头，确保只对“页面请求”（HTML）进行重定向。
  // 如果是 JS/CSS/图片等资源 404，必须返回原始 404 响应，否则会导致浏览器解析错误并进入死循环。
  if (response.status === 404 && isPageRequest) {
    // 🌟 核心修复：如果 404 路径是以有效集合开头的（例如 /moments/index），
    // 将其重定向到带语言环境的集合根路径（例如 /zh/moments）
    if (urlLocale && site.collections.includes(urlLocale)) {
      return new Response(null, {
        status: 302,
        headers: { location: `/${getPreferredLocale()}/${urlLocale}` }
      });
    }

    const currentLocale = (urlLocale && supportedLocaleCodes.includes(urlLocale)) 
      ? urlLocale 
      : getPreferredLocale();

    const targetPath = `/${currentLocale}`;

    // 防止死循环：如果当前已经在重定向的目标页却依然 404，则不再跳转
    if (pathname === targetPath || pathname === `/${currentLocale}`) {
      return response;
    }

    return new Response(null, {
      status: 302,
      headers: { location: targetPath }
    });
  }

  return response;
};