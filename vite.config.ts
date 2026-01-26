import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// 自定义插件：将 content.js 的依赖内联
function inlineContentScript() {
  return {
    name: 'inline-content-script',
    enforce: 'post' as const,
    generateBundle(options: any, bundle: any) {
      const contentJs = bundle['content.js']
      if (!contentJs || contentJs.type !== 'chunk') return

      // 收集所有被 content.js 引用的 chunk
      const contentChunks = new Set<string>()
      const collectChunks = (chunk: any) => {
        if (chunk.imports) {
          chunk.imports.forEach((imp: string) => {
            if (bundle[imp] && !contentChunks.has(imp)) {
              contentChunks.add(imp)
              collectChunks(bundle[imp])
            }
          })
        }
      }
      collectChunks(contentJs)

      // 将所有依赖的代码合并到 content.js
      let code = ''
      contentChunks.forEach(chunkName => {
        const chunk = bundle[chunkName]
        if (chunk && chunk.type === 'chunk') {
          code += chunk.code + '\n'
        }
      })

      // 移除 content.js 中的 import 语句
      let contentCode = contentJs.code
      contentCode = contentCode.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?/g, '')
      contentCode = contentCode.replace(/import\s+[^;]+from\s*['"][^'"]+['"]\s*;?/g, '')
      contentCode = contentCode.replace(/import\s*['"][^'"]+['"]\s*;?/g, '')

      code += contentCode

      // 包装成 IIFE
      contentJs.code = `(function(){\n'use strict';\n${code}\n})()`

      // 清空 imports
      contentJs.imports = []
      contentJs.dynamicImports = []
    }
  }
}

// 自定义插件：移动 HTML 文件到根目录
function moveHtmlToRoot() {
  return {
    name: 'move-html-to-root',
    enforce: 'post' as const,
    writeBundle(options: any, bundle: any) {
      // 在文件写入后，移动 HTML 文件
      const distPath = options.dir || 'dist'

      // 移动 popup.html
      const popupSrc = path.join(distPath, 'src/popup/index.html')
      const popupDest = path.join(distPath, 'popup.html')
      if (fs.existsSync(popupSrc)) {
        let content = fs.readFileSync(popupSrc, 'utf-8')
        // 修改路径：从 ../../ 到 ./
        content = content.replace(/\.\.\/..\//g, './')
        fs.writeFileSync(popupDest, content)
        console.log('✓ Moved popup.html to root')
      }

      // 移动 options.html
      const optionsSrc = path.join(distPath, 'src/options/index.html')
      const optionsDest = path.join(distPath, 'options.html')
      if (fs.existsSync(optionsSrc)) {
        let content = fs.readFileSync(optionsSrc, 'utf-8')
        // 修改路径：从 ../../ 到 ./
        content = content.replace(/\.\.\/..\//g, './')
        fs.writeFileSync(optionsDest, content)
        console.log('✓ Moved options.html to root')
      }

      // 移动 chat.html
      const chatSrc = path.join(distPath, 'src/chat/index.html')
      const chatDest = path.join(distPath, 'chat.html')
      if (fs.existsSync(chatSrc)) {
        let content = fs.readFileSync(chatSrc, 'utf-8')
        // 修改路径：从 ../../ 到 ./
        content = content.replace(/\.\.\/..\//g, './')
        fs.writeFileSync(chatDest, content)
        console.log('✓ Moved chat.html to root')
      }

      // 删除 src 目录
      const srcDir = path.join(distPath, 'src')
      if (fs.existsSync(srcDir)) {
        fs.rmSync(srcDir, { recursive: true, force: true })
        console.log('✓ Cleaned up src directory')
      }
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    inlineContentScript(),
    moveHtmlToRoot(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'src/icons',
          dest: '.'
        }
      ]
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        chat: resolve(__dirname, 'src/chat/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'content.css'
          return '[name].[ext]'
        }
      }
    }
  }
})
