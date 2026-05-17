import { error, json } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  // 1. 安全验证 (复用你已有的 REVALIDATE_TOKEN)
  const authHeader = request.headers.get('Authorization');
  if (!env.REVALIDATE_TOKEN || authHeader !== `Bearer ${env.REVALIDATE_TOKEN}`) {
    throw error(401, 'Unauthorized');
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'images'; // 默认为 images，也可支持 videos

    if (!file) {
      throw error(400, 'No file uploaded');
    }

    // 2. 路径解析
    // process.cwd() 在 PM2 (根据你的 ecosystem.config.js) 和本地开发时都指向项目根目录
    const rootDir = process.cwd();
    const uploadDir = path.resolve(rootDir, type);

    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成文件名 (时间戳 + 原始名，避免冲突)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${safeFileName}`;
    const filePath = path.join(uploadDir, filename);

    // 3. 写入文件系统
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    console.log(`[Upload] File saved to: ${filePath}`);

    // 4. 返回可以通过 Web 访问的路径
    return json({
      success: true,
      url: `/${type}/${filename}`
    });
  } catch (err: any) {
    throw error(500, err.message || 'Upload failed');
  }
};