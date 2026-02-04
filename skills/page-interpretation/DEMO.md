# 页面解读 Skill 使用示例

本文档展示了如何使用页面解读 skill 来解读网页并生成 skill 文档。

## 示例 1: 解读登录页面

### 场景描述

用户想要为一个新网站的登录页面创建操作 skill。

### 操作步骤

1. **访问目标页面**
   - 导航到 `https://example.com/login`

2. **提取页面摘要**
   ```json
   {
     "tool_name": "summarize_page",
     "arguments": {
       "includeStructuredData": true,
       "includeMetadata": true
     }
   }
   ```

3. **分析页面结构**
   ```json
   {
     "tool_name": "extract_data",
     "arguments": {
       "dataType": "form"
     }
   }
   ```

4. **识别关键元素**
   - 使用 `page_action` 工具探索页面元素
   - 识别用户名输入框、密码输入框、登录按钮

5. **生成 Skill 文档**

### 生成的文档示例

```markdown
---
name: example-login
description: 为 example.com 网站提供登录操作的 DOM 选择器信息。适用于需要在该网站执行登录操作的场景。
---

# Example.com 登录 Skill

本 skill 提供了 example.com 网站登录操作的 DOM 选择器信息。

## 适用页面

- `https://example.com/login` - 登录页面

## 核心操作和 DOM 选择器

### 1. 登录表单

**页面路径**: `/login`

**关键元素选择器**:

```javascript
{
  usernameInput: {
    selector: 'input[name="username"]',
    description: '用户名输入框',
    type: 'input',
    fallback: ['#username', 'input[type="text"][placeholder*="用户名"]']
  },
  passwordInput: {
    selector: 'input[name="password"]',
    description: '密码输入框',
    type: 'input',
    fallback: ['#password', 'input[type="password"]']
  },
  loginButton: {
    selector: 'button[type="submit"]',
    description: '登录按钮',
    type: 'button',
    fallback: ['.login-btn', 'button:contains("登录")']
  },
  rememberCheckbox: {
    selector: 'input[type="checkbox"][name="remember"]',
    description: '记住我复选框',
    type: 'checkbox',
    fallback: ['#remember']
  }
}
```

**操作流程**:
1. 定位用户名输入框：`input[name="username"]`
2. 填充用户名
3. 定位密码输入框：`input[name="password"]`
4. 填充密码
5. （可选）勾选记住我：`input[type="checkbox"][name="remember"]`
6. 点击登录按钮：`button[type="submit"]`

## 使用指南

### 基本使用模式

当需要在 example.com 执行登录操作时：

1. **导航到登录页面**: 使用 `page_action` 导航到 `https://example.com/login`
2. **查找选择器**: 使用上述预定义的选择器
3. **执行操作**: 按照操作流程执行登录步骤

### 注意事项

1. **动态加载**: 页面使用 React 框架，元素可能动态加载，需要等待元素出现
2. **验证码**: 某些情况下可能需要处理验证码
3. **错误处理**: 登录失败时会显示错误消息，需要检查 `.error-message` 元素
```

## 示例 2: 解读搜索页面

### 场景描述

用户想要为一个电商网站的搜索功能创建操作 skill。

### 操作步骤

1. **访问目标页面**
   - 导航到 `https://shop.example.com`

2. **提取页面摘要**
   ```json
   {
     "tool_name": "summarize_page",
     "arguments": {
       "includeStructuredData": true
     }
   }
   ```

3. **分析搜索功能**
   - 识别搜索输入框
   - 识别搜索按钮
   - 识别搜索结果容器

4. **测试搜索流程**
   - 执行一次搜索操作
   - 观察搜索结果页面结构

5. **生成 Skill 文档**

### 生成的文档示例

```markdown
---
name: shop-search
description: 为 shop.example.com 电商网站提供搜索操作的 DOM 选择器信息。适用于需要在该网站执行商品搜索的场景。
---

# Shop.example.com 搜索 Skill

## 适用页面

- `https://shop.example.com/**` - 网站的所有页面

## 核心操作和 DOM 选择器

### 1. 搜索功能

**页面路径**: 所有页面（搜索框在顶部导航栏）

**关键元素选择器**:

```javascript
{
  searchInput: {
    selector: 'input[name="q"]',
    description: '搜索输入框',
    type: 'input',
    fallback: ['#search-input', '.search-box input', 'input[type="search"]']
  },
  searchButton: {
    selector: 'button[type="submit"][aria-label="搜索"]',
    description: '搜索按钮',
    type: 'button',
    fallback: ['button[type="submit"]', '.search-btn', 'button:contains("搜索")']
  },
  resultsContainer: {
    selector: '.search-results',
    description: '搜索结果容器',
    type: 'container',
    fallback: ['#results', '.result-list', 'main[role="main"]']
  },
  resultItems: {
    selector: '.product-card',
    description: '商品卡片',
    type: 'cards',
    fallback: ['.result-item', '.product-item']
  }
}
```

**操作流程**:
1. 定位搜索输入框：`input[name="q"]`
2. 填充搜索关键词
3. 点击搜索按钮：`button[type="submit"][aria-label="搜索"]`
4. 等待搜索结果加载（等待 `.search-results` 出现）
5. 提取搜索结果：使用 `extract_data` 工具提取 `.product-card` 数据

### 2. 搜索结果筛选

**页面路径**: `/search?q=关键词`

**关键元素选择器**:

```javascript
{
  priceFilter: {
    selector: 'select[name="price"]',
    description: '价格筛选下拉框',
    type: 'select',
    fallback: ['#price-filter', 'select[aria-label*="价格"]']
  },
  categoryFilter: {
    selector: 'input[type="checkbox"][name="category"]',
    description: '分类筛选复选框',
    type: 'checkbox',
    fallback: ['.category-filter input']
  },
  applyFilterButton: {
    selector: 'button[type="submit"][aria-label="应用筛选"]',
    description: '应用筛选按钮',
    type: 'button',
    fallback: ['button:contains("应用")', '.apply-filter-btn']
  }
}
```

**操作流程**:
1. 选择价格范围：`select[name="price"]`
2. （可选）选择分类：`input[type="checkbox"][name="category"]`
3. 点击应用筛选按钮：`button[type="submit"][aria-label="应用筛选"]`
4. 等待结果更新

## 使用指南

### 基本使用模式

1. **执行搜索**: 使用搜索功能的选择器执行搜索操作
2. **筛选结果**: 使用筛选功能的选择器筛选搜索结果
3. **提取数据**: 使用 `extract_data` 工具提取商品信息

### 注意事项

1. **动态加载**: 搜索结果使用 AJAX 加载，需要等待 `.search-results` 出现
2. **分页**: 搜索结果可能分页，需要处理分页逻辑
3. **URL 参数**: 搜索关键词会出现在 URL 中，可以通过 URL 判断是否在搜索结果页
```

## 示例 3: 解读表单页面

### 场景描述

用户想要为一个联系表单页面创建操作 skill。

### 操作步骤

1. **访问目标页面**
   - 导航到 `https://example.com/contact`

2. **提取表单结构**
   ```json
   {
     "tool_name": "extract_data",
     "arguments": {
       "dataType": "form"
     }
   }
   ```

3. **识别所有表单字段**
   - 识别必填字段和可选字段
   - 识别字段类型（文本、邮箱、电话等）
   - 识别提交按钮

4. **生成 Skill 文档**

### 生成的文档示例

```markdown
---
name: contact-form
description: 为 example.com 网站提供联系表单操作的 DOM 选择器信息。适用于需要自动填充和提交联系表单的场景。
---

# Example.com 联系表单 Skill

## 适用页面

- `https://example.com/contact` - 联系表单页面

## 核心操作和 DOM 选择器

### 1. 联系表单

**页面路径**: `/contact`

**关键元素选择器**:

```javascript
{
  formFields: {
    nameInput: {
      selector: 'input[name="name"]',
      description: '姓名输入框（必填）',
      type: 'input',
      fallback: ['#name', 'input[placeholder*="姓名"]']
    },
    emailInput: {
      selector: 'input[name="email"]',
      description: '邮箱输入框（必填）',
      type: 'input',
      fallback: ['#email', 'input[type="email"]']
    },
    phoneInput: {
      selector: 'input[name="phone"]',
      description: '电话输入框（可选）',
      type: 'input',
      fallback: ['#phone', 'input[type="tel"]']
    },
    messageTextarea: {
      selector: 'textarea[name="message"]',
      description: '留言输入框（必填）',
      type: 'textarea',
      fallback: ['#message', 'textarea[placeholder*="留言"]']
    },
    submitButton: {
      selector: 'button[type="submit"]',
      description: '提交按钮',
      type: 'button',
      fallback: ['.submit-btn', 'button:contains("提交")']
    }
  },
  successMessage: {
    selector: '.success-message',
    description: '提交成功消息',
    type: 'container',
    fallback: ['.alert-success', '[role="alert"]']
  },
  errorMessage: {
    selector: '.error-message',
    description: '错误消息',
    type: 'container',
    fallback: ['.alert-error', '.form-error']
  }
}
```

**操作流程**:
1. 定位姓名输入框：`input[name="name"]`
2. 填充姓名
3. 定位邮箱输入框：`input[name="email"]`
4. 填充邮箱
5. （可选）定位电话输入框：`input[name="phone"]`
6. （可选）填充电话
7. 定位留言输入框：`textarea[name="message"]`
8. 填充留言内容
9. 点击提交按钮：`button[type="submit"]`
10. 等待提交结果（检查 `.success-message` 或 `.error-message`）

## 使用指南

### 基本使用模式

1. **导航到表单页面**: 使用 `page_action` 导航到 `https://example.com/contact`
2. **填充表单字段**: 按照操作流程填充所有必填字段
3. **提交表单**: 点击提交按钮
4. **验证结果**: 检查成功或错误消息

### 注意事项

1. **必填字段**: 姓名、邮箱、留言为必填字段，必须填充
2. **字段验证**: 邮箱格式会被验证，确保输入有效邮箱
3. **提交等待**: 提交后需要等待服务器响应，可能需要 2-3 秒
4. **错误处理**: 如果提交失败，检查 `.error-message` 获取错误信息
```

## 示例 4: 生成美观的可视化预览

### 场景描述

生成 MD 文档后，创建美观的可视化预览，类似截图工具的效果。

### 操作步骤

1. **生成 MD 文档**（如示例1-3）

2. **解析文档内容**，提取关键信息：
   - Skill 名称和描述
   - 适用页面
   - 操作列表
   - 选择器信息

3. **生成可视化预览**

### 可视化预览示例

#### 卡片预览

生成一个美观的卡片预览，展示 skill 的关键信息：

```html
<div class="skill-preview-card" style="
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  margin: 16px 0;
">
  <div class="skill-header" style="
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid rgba(255,255,255,0.2);
    padding-bottom: 12px;
  ">
    <h2 style="margin: 0; font-size: 24px;">Example.com 登录 Skill</h2>
    <span style="
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
    ">新创建</span>
  </div>
  
  <div class="skill-info" style="margin-bottom: 20px;">
    <div style="display: flex; margin-bottom: 12px;">
      <span style="font-weight: 600; margin-right: 8px; min-width: 80px;">适用页面:</span>
      <code style="background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px;">
        https://example.com/login
      </code>
    </div>
    <div style="display: flex; margin-bottom: 12px;">
      <span style="font-weight: 600; margin-right: 8px; min-width: 80px;">操作数量:</span>
      <span>1 个核心操作</span>
    </div>
  </div>
  
  <div class="skill-operations" style="margin-bottom: 24px;">
    <div style="font-weight: 600; margin-bottom: 12px;">核心操作:</div>
    <div style="display: flex; gap: 8px;">
      <div style="
        background: rgba(255,255,255,0.15);
        padding: 8px 16px;
        border-radius: 8px;
      ">
        🔐 登录表单
      </div>
    </div>
  </div>
  
  <div class="skill-actions" style="
    display: flex;
    gap: 12px;
    border-top: 2px solid rgba(255,255,255,0.2);
    padding-top: 16px;
  ">
    <button style="
      flex: 1;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    ">📥 下载 MD 文件</button>
    <button style="
      flex: 1;
      background: white;
      color: #667eea;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    ">👁️ 查看完整文档</button>
  </div>
</div>
```

#### 选择器可视化

为每个选择器生成可视化卡片：

```html
<div class="selector-card" style="
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
">
  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f0;
        border-radius: 6px;
      ">📝</span>
      <span style="font-weight: 600; font-size: 16px;">usernameInput</span>
    </div>
    <span style="
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
    ">input</span>
  </div>
  
  <div style="
    background: #f8f9fa;
    border-left: 3px solid #667eea;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  ">
    <div style="font-size: 11px; color: #666; margin-bottom: 4px;">主选择器:</div>
    <code style="
      font-family: 'Monaco', monospace;
      font-size: 14px;
      color: #e83e8c;
    ">input[name="username"]</code>
    <button style="
      float: right;
      background: #667eea;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    ">复制</button>
  </div>
  
  <div style="color: #666; font-size: 14px; margin-bottom: 12px;">
    用户名输入框
  </div>
  
  <div style="border-top: 1px solid #e0e0e0; padding-top: 12px;">
    <div style="font-size: 12px; color: #999; margin-bottom: 8px;">备用选择器:</div>
    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
      <code style="
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      ">#username</code>
      <code style="
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      ">input[type="text"]</code>
    </div>
  </div>
</div>
```

#### 操作流程可视化

生成步骤流程图：

```html
<div class="workflow-visualization" style="
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 16px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
">
  <h3 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600;">
    📋 操作流程
  </h3>
  
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      ">1</div>
      <div style="
        flex: 1;
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">定位用户名输入框</div>
        <code style="
          font-family: 'Monaco', monospace;
          font-size: 13px;
          color: #e83e8c;
          background: white;
          padding: 6px 10px;
          border-radius: 4px;
        ">input[name="username"]</code>
      </div>
    </div>
    
    <div style="text-align: center; color: #667eea; font-size: 24px;">↓</div>
    
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      ">2</div>
      <div style="
        flex: 1;
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      ">
        <div style="font-weight: 600;">填充用户名</div>
      </div>
    </div>
    
    <!-- 更多步骤... -->
  </div>
</div>
```

### 预览功能特性

1. **美观的视觉设计**: 使用渐变背景、圆角、阴影等现代设计元素
2. **关键信息突出**: 高亮显示 skill 名称、操作数量、选择器
3. **代码高亮**: 选择器代码使用语法高亮显示
4. **交互功能**: 
   - 一键复制选择器
   - 下载 MD 文件
   - 展开/折叠详细信息
5. **响应式设计**: 适配不同屏幕尺寸
6. **多种样式主题**: 现代、简约、彩色等风格可选

## 总结

以上示例展示了如何使用页面解读 skill 来：

1. **解读不同类型的页面**: 登录页、搜索页、表单页
2. **识别关键元素**: 输入框、按钮、容器等
3. **提取选择器**: 使用稳定的属性选择器
4. **生成操作流程**: 清晰的步骤说明
5. **生成完整文档**: 符合 skill 格式的 MD 文档
6. **生成美观预览**: 创建类似截图工具效果的可视化预览

通过这些示例，AI 可以学习如何系统地解读页面并生成高质量的 skill 文档和可视化预览。

## 示例 5: 前端集成实现

### 场景描述

将生成的美观预览在前端聊天界面中正确显示，并提供交互功能。

### 实现步骤

#### 1. 更新类型定义

在 `src/utils/types.ts` 中添加 HTML block 类型：

```typescript
export type ContentBlockType = 'text' | 'tool_use' | 'summary' | 'question' | 'image' | 'html'

export interface HtmlBlock {
  type: 'html'
  html: string
  style?: string
  data?: {
    markdownContent?: string
    skillName?: string
    fileName?: string
  }
}
```

#### 2. 在 App.vue 中添加渲染逻辑

```vue
<!-- HTML Block (Skill 预览) -->
<div v-else-if="block.type === 'html'" class="html-block skill-preview-block">
  <div 
    class="skill-preview-container"
    v-html="sanitizeHtml((block as HtmlBlock).html)"
  ></div>
  
  <div v-if="(block as HtmlBlock).data" class="skill-preview-actions">
    <button 
      v-if="(block as HtmlBlock).data.markdownContent"
      class="btn btn-download-skill"
      @click="downloadSkillFile((block as HtmlBlock).data)"
    >
      📥 下载 MD 文件
    </button>
  </div>
</div>
```

#### 3. 添加交互处理函数

```typescript
// HTML 安全处理
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'span', 'h2', 'code', 'button', ...],
    ALLOWED_ATTR: ['class', 'style', 'onclick', 'data-*', ...],
    ALLOWED_STYLES: { '*': { 'color': true, 'background': true, ... } }
  })
}

// 下载文件
const downloadSkillFile = (data: any) => {
  const blob = new Blob([data.markdownContent], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = data.fileName || `skill_${Date.now()}.md`
  link.click()
  URL.revokeObjectURL(url)
}

// 复制选择器（使用事件委托）
const handlePreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('copy-selector-btn')) {
    const selector = target.getAttribute('data-selector')
    navigator.clipboard.writeText(selector || '')
    showToast('选择器已复制')
  }
}
```

#### 4. 添加样式

```css
.skill-preview-block {
  margin: 16px 0;
  max-width: 100%;
}

.skill-preview-container {
  width: 100%;
  min-height: 200px;
}

.skill-preview-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
```

### 完整示例：生成并显示预览

```typescript
// AI 生成 skill 文档后，创建预览消息
const skillData = {
  name: 'example-login',
  description: '登录操作',
  pagePattern: 'https://example.com/login',
  operations: [{ name: '登录表单', icon: '🔐' }],
  selectors: [/* ... */],
  markdownContent: '...' // 完整的 MD 文档
}

const previewMessage: StreamMessage = {
  sessionId: currentSessionId.value,
  role: 'assistant',
  blocks: [
    { type: 'text', text: '✅ Skill 文档已生成！' },
    {
      type: 'html',
      html: generateSkillPreviewHTML(skillData),
      data: {
        markdownContent: skillData.markdownContent,
        fileName: `${skillData.name}.md`
      }
    } as HtmlBlock
  ],
  createdAt: Date.now()
}

streamMessages.value.push(previewMessage)
```

### 效果展示

前端集成后，用户将看到：

1. **美观的卡片预览**：渐变背景、圆角、阴影效果
2. **交互式选择器卡片**：点击复制按钮即可复制选择器
3. **操作流程可视化**：清晰的步骤流程图
4. **一键下载**：点击按钮即可下载 MD 文件
5. **响应式设计**：在不同设备上都能正常显示

### 注意事项

1. **安全性**：必须使用 DOMPurify 清理 HTML，防止 XSS 攻击
2. **事件处理**：使用事件委托处理动态插入的 HTML 中的交互
3. **样式隔离**：使用 scoped 样式或命名空间避免样式冲突
4. **性能优化**：对于大型预览，考虑延迟加载或虚拟滚动

详细的实现指南请参考：[references/frontend-integration.md](references/frontend-integration.md)
