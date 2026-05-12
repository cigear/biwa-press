import type { Handle } from '@sveltejs/kit';
import { locales } from '$lib/config/locales'; // Import locales config

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
      headers: { location: `/${locale}/` }
    });
  }

  // 2. Check if the locale in the URL is valid for /<locale>/... paths
  const pathParts = pathname.split('/');
  const urlLocale = pathParts.length > 1 ? pathParts[1] : null;
  const isPageRequest = event.request.headers.get('accept')?.includes('text/html');

  if (urlLocale && !supportedLocaleCodes.includes(urlLocale) && isPageRequest) {
    const locale = getPreferredLocale();
    return new Response(null, {
      status: 302,
      headers: { location: `/${locale}/` }
    });
  }

  // Resolve the request first
  const response = await resolve(event);

  // 3. 处理 404 错误
  // 重点修复：检查 Accept 头，确保只对“页面请求”（HTML）进行重定向。
  // 如果是 JS/CSS/图片等资源 404，必须返回原始 404 响应，否则会导致浏览器解析错误并进入死循环。
  if (response.status === 404 && isPageRequest) {
    const currentLocale = (urlLocale && supportedLocaleCodes.includes(urlLocale)) 
      ? urlLocale 
      : getPreferredLocale();

    const targetPath = `/${currentLocale}/`;

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