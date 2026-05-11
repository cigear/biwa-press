#!/bin/bash

# 确保脚本在出错时停止执行
set -e

# 切换到项目根目录
cd "$(dirname "$0")/.."

echo "🚀 Starting SSG build..."
npm run build:ssg

echo "📦 Packaging for deployment (build/ssg)..."
tar -czvf deploy-ssg.tar.gz build/ssg

echo "✅ Done! 'deploy-ssg.tar.gz' has been created in the project root."