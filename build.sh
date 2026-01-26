#!/bin/bash

# AI Chat Extension - 快速构建和测试脚本

echo "🚀 AI Chat Extension - 快速构建"
echo "================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"
echo "✓ npm 版本: $(npm -v)"
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 构建成功！"
    echo ""
    echo "📋 下一步操作："
    echo "1. 打开 Chrome 浏览器"
    echo "2. 访问 chrome://extensions/"
    echo "3. 开启右上角的 '开发者模式'"
    echo "4. 点击 '加载已解压的扩展程序'"
    echo "5. 选择项目的 dist 目录"
    echo ""
    echo "🧪 测试页面："
    echo "打开 test-page.html 文件进行测试"
    echo ""
    echo "📁 构建输出目录: $(pwd)/dist"
    echo ""

    # 检查是否在 macOS 上，如果是则提供打开文件夹的选项
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "💡 提示: 运行 'open dist' 可以在 Finder 中打开构建目录"
    fi
else
    echo ""
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
