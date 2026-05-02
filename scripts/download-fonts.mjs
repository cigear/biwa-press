#!/usr/bin/env node

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../static/fonts');

// 从Google Fonts CSS中提取字体URL
const getFontUrlsFromGoogle = async (fontName, weights) => {
  return new Promise((resolve, reject) => {
    const fontString = fontName.replace(/-/g, '+');
    const weightString = weights.join(';');
    
    const url = `https://fonts.googleapis.com/css2?family=${fontString}:wght@${weightString}&display=swap`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          // 从CSS中解析URL
          const urls = {};
          const regex = /font-weight:\s*(\d+)[\s\S]*?url\((https:\/\/[^)]+\.woff2)\)/g;
          let match;
          
          while ((match = regex.exec(data)) !== null) {
            urls[match[1]] = match[2];
          }
          
          resolve(urls);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// 字体配置
const fontConfigs = [
  { name: 'Inter', filename: 'inter', weights: [400, 500, 600, 700] },
  { name: 'Noto Sans JP', filename: 'noto-sans-jp', weights: [400, 500, 600, 700] },
  { name: 'Noto Sans SC', filename: 'noto-sans-sc', weights: [400, 500, 600, 700] }
];

// 下载文件的函数
const downloadFile = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filepath);
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filepath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // 删除失败的文件
        reject(err);
      });
    }).on('error', reject);
  });
};

// 主函数
const downloadFonts = async () => {
  console.log('📥 开始下载字体文件...\n');

  try {
    for (const config of fontConfigs) {
      console.log(`⬇️  正在获取 ${config.name} 字体URLs...`);
      
      try {
        const urls = await getFontUrlsFromGoogle(config.name, config.weights);
        
        if (Object.keys(urls).length === 0) {
          console.error(`❌ 未能获取 ${config.name} 的字体URL`);
          continue;
        }
        
        console.log(`✓ 成功获取URLs，开始下载...\n`);
        
        for (const weight of config.weights) {
          const url = urls[weight];
          
          if (!url) {
            console.error(`⚠️  找不到 weight ${weight} 的URL`);
            continue;
          }

          const filename = `${config.filename}-${weight}.woff2`;
          const filepath = path.join(FONTS_DIR, config.filename, filename);

          try {
            console.log(`   ⏳ ${filename}...`);
            await downloadFile(url, filepath);
            console.log(`   ✅`);
          } catch (error) {
            console.error(`   ❌ ${error.message}`);
          }
        }
        console.log();
      } catch (error) {
        console.error(`❌ 获取 ${config.name} 字体失败: ${error.message}\n`);
      }
    }

    console.log('✅ 字体下载完成！');
    console.log(`📁 字体已保存到: ${FONTS_DIR}`);
  } catch (error) {
    console.error('❌ 下载字体时发生错误:', error);
    process.exit(1);
  }
};

// 运行下载
downloadFonts();
