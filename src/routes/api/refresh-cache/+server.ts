import { json, type RequestHandler } from '@sveltejs/kit';
import { clearSidebarCache } from '$lib/docs.server';
import { clearSearchCache } from '$lib/search';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const token = env.REVALIDATE_TOKEN;

  if (!token) {
    console.error('[Biwa Press] REVALIDATE_TOKEN is not defined in environment variables.');
    return json({ message: 'Server configuration error' }, { status: 500 });
  }

  // 验证 Token
  if (authHeader !== `Bearer ${token}`) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  clearSidebarCache();
  clearSearchCache();
  
  return json({ message: 'Caches cleared successfully', timestamp: new Date().toISOString() });
};