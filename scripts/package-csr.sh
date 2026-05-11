#!/bin/bash

# 确保脚本在出错时停止执行
set -e

# 切换到项目根目录
cd "$(dirname "$0")/.."

echo "🚀 Starting CSR build..."
npm run build:csr

echo "📦 Packaging for deployment (build/csr)..."
tar -czvf deploy-csr.tar.gz build/csr

echo "✅ Done! 'deploy-csr.tar.gz' has been created in the project root."