# 前端集成快速开始

本文档提供了快速集成 skill 预览功能到前端的简化步骤。

## ⚠️ 重要：不依赖后端格式

**前端集成方案是灵活的，不强制要求后端返回特定格式。**

**推荐方案：前端直接生成预览**（不依赖后端改动）

## 快速实现（5 步）- 方案A（推荐）

### 1. 更新类型定义

```typescript
// src/utils/types.ts

export type ContentBlockType = 'text' | 'tool_use' | 'summary' | 'question' | 'image' | 'html'

export interface HtmlBlock {
  type: 'html'
  html: string
  data?: {
    markdownContent?: string
    fileName?: string
  }
}

export type ContentBlock = TextBlock | ToolUseBlock | SummaryBlock | QuestionBlock | HtmlBlock
```

### 2. 添加渲染模板

```vue
<!-- src/chat/App.vue -->

<div v-else-if="block.type === 'html'" class="html-block">
  <div v-html="sanitizeHtml((block as HtmlBlock).html)"></div>
  <button v-if="(block as HtmlBlock).data?.markdownContent" 
          @click="downloadFile((block as HtmlBlock).data)">
    下载 MD 文件
  </button>
</div>
```

### 3. 添加安全处理

```typescript
// 安装: npm install dompurify @types/dompurify
import DOMPurify from 'dompurify'

const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'span', 'h2', 'code', 'button', 'p', 'strong'],
    ALLOWED_ATTR: ['class', 'style', 'data-*'],
    ALLOWED_STYLES: {
      '*': {
        'color': true, 'background': true, 'padding': true,
        'margin': true, 'border': true, 'border-radius': true
      }
    }
  })
}
```

### 4. 添加下载功能

```typescript
const downloadFile = (data: { markdownContent: string; fileName?: string }) => {
  const blob = new Blob([data.markdownContent], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = data.fileName || `skill_${Date.now()}.md`
  link.click()
  URL.revokeObjectURL(url)
}
```

### 5. 添加基本样式

```css
.html-block {
  margin: 16px 0;
  max-width: 100%;
}

.html-block :deep(.skill-preview-card) {
  max-width: 100%;
  box-sizing: border-box;
}
```

## 生成预览消息示例

### 方案A：前端解析 MD 并生成（推荐）

```typescript
// 当 AI 返回包含 MD 文档的文本时
const handleAIResponse = (content: string) => {
  // 1. 检测并提取 MD 文档
  const mdMatch = content.match(/```markdown\n([\s\S]*?)\n```/)
  if (!mdMatch) return
  
  const markdown = mdMatch[1]
  
  // 2. 简单解析（提取关键信息）
  const nameMatch = markdown.match(/name:\s*(.+)/)
  const name = nameMatch ? nameMatch[1].trim() : 'skill'
  
  // 3. 生成 HTML 预览
  const html = `
    <div class="skill-preview-card" style="...">
      <h2>${name} Skill</h2>
      <!-- 更多内容 -->
    </div>
  `
  
  // 4. 创建消息
  const message: StreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    blocks: [
      { type: 'text', text: '✅ Skill 已生成！' },
      {
        type: 'html',
        html: sanitizeHtml(html),
        data: { markdownContent: markdown, fileName: `${name}.md` }
      } as HtmlBlock
    ],
    createdAt: Date.now()
  }
  
  streamMessages.value.push(message)
}
```

### 方案B：后端返回 HTML（如果后端已支持）

```typescript
// 后端返回：{ markdown: "...", previewHtml: "<div>...</div>" }
const message: StreamMessage = {
  blocks: [
    { type: 'text', text: '✅ Skill 已生成！' },
    {
      type: 'html',
      html: response.previewHtml,  // 直接使用
      data: { markdownContent: response.markdown }
    } as HtmlBlock
  ]
}
```

## 完整文档

详细实现请参考：[frontend-integration.md](frontend-integration.md)

**重要提示**：推荐使用方案A（前端生成），因为它不依赖后端改动，更灵活可控。
