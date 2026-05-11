#!/bin/bash

# 确保脚本在出错时停止执行
set -e

# 切换到项目根目录
cd "$(dirname "$0")/.."

echo "🚀 Starting SSR build..."
npm run build:ssr

echo "📦 Packaging for deployment (build/ssr, docs, package.json, package-lock.json)..."
tar -czvf deploy-ssr.tar.gz build/ssr docs package.json package-lock.json

echo "✅ Done! 'deploy-ssr.tar.gz' has been created in the project root."