# 前端集成指南

本文档提供了如何在前端聊天界面中显示美观的 skill 预览效果的完整实现方案。

## ⚠️ 重要说明：不依赖后端格式

**前端集成方案是灵活的，不强制要求后端返回特定格式。** 你可以选择以下任一方案：

- **方案A：前端直接生成** - AI 生成 MD 文档后，前端解析并生成 HTML 预览（推荐）
- **方案B：后端返回 HTML** - 后端生成 HTML，前端直接渲染
- **方案C：后端返回结构化数据** - 后端返回 JSON，前端根据数据生成 HTML

**推荐使用方案A**，因为：
- ✅ 不依赖后端改动
- ✅ 前端完全控制预览样式
- ✅ 可以灵活调整和优化
- ✅ 减少后端负担

## 目录

- [实现方案选择](#实现方案选择)
- [方案A：前端直接生成（推荐）](#方案a前端直接生成推荐)
- [方案B：后端返回HTML](#方案b后端返回html)
- [方案C：后端返回结构化数据](#方案c后端返回结构化数据)
- [添加新的 Block 类型](#添加新的-block-类型)
- [前端渲染实现](#前端渲染实现)
- [交互功能实现](#交互功能实现)
- [样式优化](#样式优化)

## 实现方案选择

### 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **方案A：前端生成** | 不依赖后端、灵活可控 | 前端代码较多 | ✅ **推荐** - 大多数情况 |
| **方案B：后端返回HTML** | 前端简单、后端统一 | 依赖后端改动、样式难调 | 后端已支持HTML生成 |
| **方案C：后端返回数据** | 前后端分离、数据清晰 | 需要约定数据结构 | 前后端协作开发 |

## 方案A：前端直接生成（推荐）

### 核心思路

AI 生成 MD 文档后，前端：
1. 解析 MD 文档内容
2. 提取关键信息（skill名称、操作、选择器等）
3. 在前端生成 HTML 预览
4. 渲染到聊天界面

### 实现步骤

#### 1. 解析 MD 文档

```typescript
// 解析 MD 文档，提取关键信息
const parseSkillMarkdown = (markdown: string) => {
  // 解析 frontmatter
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/)
  const frontmatter = frontmatterMatch ? parseYAML(frontmatterMatch[1]) : {}
  
  // 提取 skill 名称和描述
  const name = frontmatter.name || 'unknown'
  const description = frontmatter.description || ''
  
  // 提取适用页面
  const pagePatternMatch = markdown.match(/## 适用页面\n([\s\S]*?)(?=\n##|$)/)
  const pagePattern = pagePatternMatch ? pagePatternMatch[1].trim() : ''
  
  // 提取操作列表（简化版，实际可以使用更复杂的解析）
  const operations: Array<{ name: string; icon: string }> = []
  const operationMatches = markdown.matchAll(/### \d+\.\s+(.+?)\n/g)
  for (const match of operationMatches) {
    const operationName = match[1].trim()
    // 根据操作名称选择图标
    const icon = getOperationIcon(operationName)
    operations.push({ name: operationName, icon })
  }
  
  // 提取选择器（简化版）
  const selectors: Array<{
    name: string
    selector: string
    description: string
    type: string
    fallback?: string[]
  }> = []
  
  // 使用正则或更复杂的解析器提取选择器信息
  const selectorMatches = markdown.matchAll(/selector:\s*['"](.+?)['"]/g)
  // ... 解析选择器
  
  return {
    name,
    description,
    pagePattern,
    operations,
    selectors,
    markdownContent: markdown
  }
}
```

#### 2. 生成 HTML 预览

```typescript
// 根据解析的数据生成 HTML
const generateSkillPreviewHTML = (skillData: {
  name: string
  description: string
  pagePattern: string
  operations: Array<{ name: string; icon: string }>
  selectors: Array<any>
}) => {
  // 使用模板生成 HTML（可以使用模板字符串或模板引擎）
  return `
    <div class="skill-preview-card" style="...">
      <div class="skill-header">
        <h2>${skillData.name} Skill</h2>
      </div>
      <div class="skill-info">
        <div>适用页面: <code>${skillData.pagePattern}</code></div>
        <div>操作数量: ${skillData.operations.length} 个</div>
      </div>
      <div class="skill-operations">
        ${skillData.operations.map(op => `
          <div class="operation-item">
            <span>${op.icon}</span>
            <span>${op.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}
```

#### 3. 在 AI 响应中处理

```typescript
// 当 AI 返回包含 MD 文档的响应时
const handleAIResponse = (response: string) => {
  // 检测是否包含 skill MD 文档
  if (response.includes('---\nname:') && response.includes('## 适用页面')) {
    // 提取 MD 文档内容
    const mdMatch = response.match(/```markdown\n([\s\S]*?)\n```/) || 
                    response.match(/---\n([\s\S]*?)(?=\n```|$)/)
    
    if (mdMatch) {
      const markdown = mdMatch[1]
      
      // 解析并生成预览
      const skillData = parseSkillMarkdown(markdown)
      const previewHTML = generateSkillPreviewHTML(skillData)
      
      // 创建预览消息
      const previewMessage: StreamMessage = {
        sessionId: currentSessionId.value,
        role: 'assistant',
        blocks: [
          { type: 'text', text: '✅ Skill 文档已生成！' },
          {
            type: 'html',
            html: previewHTML,
            data: {
              markdownContent: markdown,
              fileName: `${skillData.name}.md`
            }
          } as HtmlBlock
        ],
        createdAt: Date.now()
      }
      
      streamMessages.value.push(previewMessage)
    }
  }
}
```

### 优点

- ✅ **不依赖后端**：完全在前端处理
- ✅ **灵活可控**：可以随时调整预览样式和结构
- ✅ **易于调试**：前端可以直接看到和修改预览
- ✅ **减少后端负担**：后端只需要返回 MD 文档

## 方案B：后端返回HTML

如果后端已经支持生成 HTML，可以直接使用：

### 实现方式

```typescript
// 后端返回格式（示例）
{
  "markdown": "...",  // MD 文档
  "preview": {
    "html": "<div>...</div>",  // 后端生成的 HTML
    "type": "skill_preview"
  }
}

// 前端直接使用
const previewMessage: StreamMessage = {
  blocks: [
    { type: 'text', text: '✅ Skill 已生成！' },
    {
      type: 'html',
      html: response.preview.html,  // 直接使用后端返回的 HTML
      data: {
        markdownContent: response.markdown,
        fileName: 'skill.md'
      }
    } as HtmlBlock
  ]
}
```

## 方案C：后端返回结构化数据

如果后端返回结构化的 JSON 数据：

### 数据结构示例

```typescript
interface SkillData {
  name: string
  description: string
  pagePattern: string
  operations: Array<{
    name: string
    icon: string
    path: string
    selectors: Array<{
      name: string
      selector: string
      description: string
      type: string
      fallback?: string[]
    }>
    workflow: string[]
  }>
}
```

### 前端生成 HTML

```typescript
// 后端返回结构化数据
const skillData: SkillData = response.data

// 前端根据数据生成 HTML
const previewHTML = generateSkillPreviewHTML(skillData)

const previewMessage: StreamMessage = {
  blocks: [
    { type: 'text', text: '✅ Skill 已生成！' },
    {
      type: 'html',
      html: previewHTML,
      data: { skillData }
    } as HtmlBlock
  ]
}
```

## 添加新的 Block 类型

### 1. 更新类型定义

在 `src/utils/types.ts` 中添加新的 block 类型：

```typescript
// 添加 'html' 或 'skill_preview' 到 ContentBlockType
export type ContentBlockType = 'text' | 'tool_use' | 'summary' | 'question' | 'image' | 'html'

// 添加 HTML Block 接口
export interface HtmlBlock {
  type: 'html'
  html: string
  style?: string  // 可选的样式标识
  data?: Record<string, any>  // 附加数据（如 markdown 内容、文件名等）
}

// 更新 ContentBlock 联合类型
export type ContentBlock = TextBlock | ToolUseBlock | SummaryBlock | QuestionBlock | HtmlBlock
```

### 2. 更新消息接口（如需要）

如果需要在消息中存储额外的元数据：

```typescript
export interface StreamMessage {
  // ... 现有字段
  blocks: ContentBlock[]
  // 可以添加 skill 相关的元数据
  skillPreview?: {
    markdownContent?: string
    skillName?: string
    fileName?: string
  }
}
```

## 前端渲染实现

### 1. 在 App.vue 中添加 HTML Block 渲染

在消息渲染模板中添加 HTML block 的处理：

```vue
<template>
  <!-- 现有的 block 类型... -->
  
  <!-- HTML Block (Skill 预览) -->
  <div v-else-if="block.type === 'html'" class="html-block skill-preview-block">
    <div 
      class="skill-preview-container"
      v-html="sanitizeHtml((block as HtmlBlock).html)"
    ></div>
    
    <!-- 操作按钮 -->
    <div v-if="(block as HtmlBlock).data" class="skill-preview-actions">
      <button 
        v-if="(block as HtmlBlock).data.markdownContent"
        class="btn btn-download-skill"
        @click="downloadSkillFile((block as HtmlBlock).data)"
      >
        📥 下载 MD 文件
      </button>
      <button 
        class="btn btn-copy-skill"
        @click="copySkillContent((block as HtmlBlock).data)"
      >
        📋 复制内容
      </button>
    </div>
  </div>
</template>
```

### 2. HTML 安全处理

添加 HTML 清理函数，防止 XSS 攻击：

```typescript
import DOMPurify from 'dompurify'  // 需要安装 dompurify

// HTML 清理函数
const sanitizeHtml = (html: string): string => {
  // 使用 DOMPurify 清理 HTML，但保留样式和结构
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'h1', 'h2', 'h3', 'p', 'code', 'pre',
      'button', 'a', 'img', 'svg', 'path', 'polyline', 'line',
      'ul', 'ol', 'li', 'strong', 'em', 'br', 'hr'
    ],
    ALLOWED_ATTR: [
      'class', 'style', 'id', 'href', 'target', 'rel',
      'onclick', 'data-*', 'aria-*', 'role', 'alt', 'src'
    ],
    ALLOWED_STYLES: {
      '*': {
        'color': true,
        'background': true,
        'background-color': true,
        'background-image': true,
        'border': true,
        'border-radius': true,
        'padding': true,
        'margin': true,
        'font-size': true,
        'font-weight': true,
        'display': true,
        'flex': true,
        'gap': true,
        'box-shadow': true,
        'transition': true,
        // ... 其他需要的样式属性
      }
    }
  })
}
```

### 3. 事件委托处理交互

由于 HTML 是动态插入的，需要使用事件委托来处理交互：

```typescript
// 在组件挂载后添加事件监听
onMounted(() => {
  // 使用事件委托处理预览内的按钮点击
  const container = document.querySelector('.chat-messages')
  if (container) {
    container.addEventListener('click', handlePreviewClick)
  }
})

onUnmounted(() => {
  const container = document.querySelector('.chat-messages')
  if (container) {
    container.removeEventListener('click', handlePreviewClick)
  }
})

// 处理预览内的点击事件
const handlePreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  
  // 处理复制选择器按钮
  if (target.classList.contains('copy-selector-btn') || target.closest('.copy-selector-btn')) {
    const btn = target.classList.contains('copy-selector-btn') 
      ? target 
      : target.closest('.copy-selector-btn') as HTMLElement
    const selector = btn.getAttribute('data-selector')
    if (selector) {
      copySelector(selector)
    }
  }
  
  // 处理下载按钮
  if (target.classList.contains('btn-download') || target.closest('.btn-download')) {
    const btn = target.classList.contains('btn-download')
      ? target
      : target.closest('.btn-download') as HTMLElement
    const markdownContent = btn.getAttribute('data-markdown')
    const fileName = btn.getAttribute('data-filename')
    if (markdownContent) {
      downloadSkillFile({
        markdownContent,
        fileName: fileName || `skill_${Date.now()}.md`
      })
    }
  }
  
  // 处理展开/折叠
  if (target.classList.contains('toggle-preview') || target.closest('.toggle-preview')) {
    const container = target.closest('.skill-preview-card')
    if (container) {
      container.classList.toggle('expanded')
    }
  }
}
```

## 交互功能实现

### 1. 下载 MD 文件

```typescript
const downloadSkillFile = (data: { markdownContent: string; fileName?: string }) => {
  const blob = new Blob([data.markdownContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = data.fileName || `skill_${Date.now()}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  // 显示成功提示
  showToast('文件已下载')
}
```

### 2. 复制选择器

```typescript
const copySelector = async (selector: string) => {
  try {
    await navigator.clipboard.writeText(selector)
    showToast('选择器已复制到剪贴板')
  } catch (error) {
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = selector
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    showToast('选择器已复制到剪贴板')
  }
}
```

### 3. 复制 Skill 内容

```typescript
const copySkillContent = async (data: { markdownContent?: string; html?: string }) => {
  const content = data.markdownContent || data.html || ''
  try {
    await navigator.clipboard.writeText(content)
    showToast('内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    showToast('复制失败，请重试')
  }
}
```

### 4. 显示提示消息

```typescript
const showToast = (message: string, duration: number = 2000) => {
  // 创建 toast 元素
  const toast = document.createElement('div')
  toast.className = 'toast-message'
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, duration)
}
```

## 样式优化

### 1. 添加 Skill 预览样式

在 `App.vue` 的 `<style>` 部分添加：

```css
/* Skill 预览块样式 */
.skill-preview-block {
  margin: var(--space-3) 0;
  max-width: 100%;
  overflow-x: auto;
}

.skill-preview-container {
  /* 确保预览内容正确显示 */
  width: 100%;
  min-height: 200px;
}

/* 确保预览内的样式正确应用 */
.skill-preview-container :deep(.skill-preview-card) {
  /* 预览卡片样式已在 HTML 中内联，这里可以添加覆盖样式 */
  max-width: 100%;
  box-sizing: border-box;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .skill-preview-container :deep(.skill-preview-card) {
    padding: 16px;
    font-size: 14px;
  }
  
  .skill-preview-container :deep(.skill-header h2) {
    font-size: 20px;
  }
}

/* 操作按钮区域 */
.skill-preview-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.btn-download-skill,
.btn-copy-skill {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.btn-download-skill:hover,
.btn-copy-skill:hover {
  background: var(--bg-tertiary);
  border-color: var(--primary-500);
}

/* 确保预览内的按钮样式 */
.skill-preview-container :deep(button) {
  cursor: pointer;
  transition: all 0.3s ease;
}

.skill-preview-container :deep(button:hover) {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 代码块样式 */
.skill-preview-container :deep(code) {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 选择器卡片样式 */
.skill-preview-container :deep(.selector-card) {
  transition: all 0.3s ease;
}

.skill-preview-container :deep(.selector-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 动画 */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

### 2. 确保样式隔离

为了避免样式冲突，建议：

1. **使用 scoped 样式**：在组件中使用 `<style scoped>`
2. **使用 CSS 变量**：利用现有的 CSS 变量系统
3. **内联关键样式**：在生成的 HTML 中使用内联样式
4. **使用深度选择器**：使用 `:deep()` 来影响子元素

## 完整示例

### 示例1：前端解析 MD 并生成预览（推荐）

```typescript
// 当 AI 返回包含 MD 文档的文本时
const handleStreamContent = (content: string) => {
  // 检测是否包含 skill MD 文档
  const mdPattern = /```markdown\n([\s\S]*?)\n```|^---\nname:([\s\S]*?)(?=\n```|$)/
  const mdMatch = content.match(mdPattern)
  
  if (mdMatch) {
    const markdown = mdMatch[1] || mdMatch[2]
    
    // 解析 MD 文档
    const skillData = parseSkillMarkdown(markdown)
    
    // 生成 HTML 预览
    const previewHTML = generateSkillPreviewHTML(skillData)
    
    // 创建预览消息
    const previewMessage: StreamMessage = {
      sessionId: currentSessionId.value,
      role: 'assistant',
      blocks: [
        { type: 'text', text: '✅ Skill 文档已生成！' },
        {
          type: 'html',
          html: previewHTML,
          data: {
            markdownContent: markdown,
            fileName: `${skillData.name}.md`
          }
        } as HtmlBlock
      ],
      createdAt: Date.now()
    }
    
    streamMessages.value.push(previewMessage)
    nextTick(scrollToBottom)
  }
}
```

### 示例2：从后端结构化数据生成

```typescript
// 后端返回结构化数据
interface BackendResponse {
  skill: {
    name: string
    description: string
    pagePattern: string
    operations: Array<{ name: string; icon: string }>
    selectors: Array<any>
  }
  markdown: string
}

// 前端处理
const handleBackendResponse = (response: BackendResponse) => {
  const previewHTML = generateSkillPreviewHTML(response.skill)
  
  const previewMessage: StreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    blocks: [
      { type: 'text', text: '✅ Skill 已生成！' },
      {
        type: 'html',
        html: previewHTML,
        data: {
          markdownContent: response.markdown,
          fileName: `${response.skill.name}.md`
        }
      } as HtmlBlock
    ],
    createdAt: Date.now()
  }
  
  streamMessages.value.push(previewMessage)
}
```

### 示例3：直接使用后端返回的 HTML

```typescript
// 后端返回 HTML
interface BackendResponse {
  markdown: string
  previewHtml: string  // 后端已生成的 HTML
}

// 前端直接使用
const handleBackendResponse = (response: BackendResponse) => {
  const previewMessage: StreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    blocks: [
      { type: 'text', text: '✅ Skill 已生成！' },
      {
        type: 'html',
        html: response.previewHtml,  // 直接使用
        data: {
          markdownContent: response.markdown,
          fileName: 'skill.md'
        }
      } as HtmlBlock
    ],
    createdAt: Date.now()
  }
  
  streamMessages.value.push(previewMessage)
}
```

## 方案选择建议

### 何时使用方案A（前端生成）

✅ **推荐使用**，适合以下情况：
- 后端只返回 MD 文档或文本
- 需要灵活控制预览样式
- 不想修改后端代码
- 前端团队独立开发

### 何时使用方案B（后端返回HTML）

适合以下情况：
- 后端已有 HTML 生成能力
- 需要统一的预览样式（多端共享）
- 后端团队愿意支持

### 何时使用方案C（后端返回数据）

适合以下情况：
- 前后端协作开发
- 需要清晰的数据结构
- 前端需要根据数据做更多处理

## 最佳实践

1. **安全性**：
   - 始终使用 DOMPurify 清理 HTML（方案A和C必须）
   - 验证所有用户输入
   - 使用 CSP（Content Security Policy）

2. **性能**：
   - 延迟加载大型预览
   - 使用虚拟滚动（如果预览很多）
   - 缓存生成的 HTML（方案A）

3. **可访问性**：
   - 添加适当的 ARIA 标签
   - 确保键盘导航可用
   - 提供文本替代方案

4. **响应式**：
   - 确保在不同屏幕尺寸下正常显示
   - 测试移动端体验
   - 使用相对单位而非固定像素

5. **用户体验**：
   - 提供加载状态
   - 显示错误提示
   - 添加操作反馈（如复制成功提示）

## 注意事项

1. **XSS 防护**：
   - 方案A和C：必须使用 DOMPurify 清理 HTML
   - 方案B：如果后端可信，可以简化清理，但仍建议清理

2. **样式冲突**：使用 scoped 样式或命名空间

3. **事件处理**：使用事件委托处理动态内容

4. **浏览器兼容性**：测试不同浏览器的表现

5. **性能影响**：避免过大的 HTML 结构

6. **数据格式**：
   - **不强制要求后端返回特定格式**
   - 前端可以根据实际情况选择最适合的方案
   - 推荐方案A，因为它最灵活且不依赖后端
