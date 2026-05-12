import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  // 当用户访问根路径 / 时，根据浏览器语言自动重定向
  if (pathname === '/') {
    const acceptLanguage = event.request.headers.get('accept-language') || '';
    let locale = 'en'; // 默认回退语言

    // 简单的语言解析逻辑
    if (acceptLanguage.includes('ja')) {
      locale = 'ja';
    } else if (acceptLanguage.includes('zh')) {
      locale = 'zh';
    }

    return new Response(null, {
      status: 307,
      headers: { location: `/${locale}` }
    });
  }

  return resolve(event);
};