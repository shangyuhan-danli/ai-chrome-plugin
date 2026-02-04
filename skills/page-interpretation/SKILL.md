---
name: page-interpretation
description: 解读网页内容并生成符合skill格式的MD文档。分析页面结构、提取关键DOM选择器、识别核心操作流程，生成可用于网站自动化的skill文档。适用于需要为特定网站创建操作skill的场景。
---

# 页面解读 Skill

本 skill 提供了智能解读网页内容并生成符合 skill 格式的 MD 文档的能力。通过分析页面结构、提取关键元素选择器、识别操作流程，自动生成可用于网站自动化的 skill 文档。

## 📖 文档说明

**本 skill 文档是给 AI 读取的指导文档，用于指导 AI 如何解读页面并生成 skill 文档。**

**执行流程**:
1. 使用 `summarize_page` 工具提取页面主要内容
2. 使用 `extract_data` 工具分析页面结构（表单、表格、列表等）
3. 使用 `page_action` 工具探索页面交互元素
4. AI 分析页面结构，识别关键操作和DOM选择器
5. 按照 skill 格式生成 MD 文档

## 核心功能

### 1. 页面内容解读

#### 提取页面摘要

使用 `summarize_page` 工具获取页面核心信息：

**工具调用示例**:
```json
{
  "tool_name": "summarize_page",
  "arguments": {
    "includeStructuredData": true,
    "includeMetadata": true
  }
}
```

**返回结果**: 
```json
{
  "summary": {
    "title": "页面标题",
    "content": "主要内容文本",
    "excerpt": "摘要",
    "length": 5000,
    "siteName": "网站名称"
  },
  "structuredData": [...],
  "metadata": {...}
}
```

#### 分析页面结构

使用 `extract_data` 工具识别页面中的结构化元素：

**工具调用示例**:
```json
{
  "tool_name": "extract_data",
  "arguments": {
    "dataType": "all"
  }
}
```

**返回结果**: 包含表格、列表、表单、卡片等所有结构化数据

### 2. DOM 选择器识别

#### 识别关键元素

通过页面分析，识别以下关键元素的选择器：

1. **导航元素**: 菜单、链接、面包屑
2. **表单元素**: 输入框、按钮、下拉框、复选框
3. **内容元素**: 标题、正文、图片、列表
4. **交互元素**: 按钮、链接、选项卡

**识别策略**:
- 优先使用 `name`、`id`、`aria-label` 等稳定属性
- 识别 `type`、`role` 等语义化属性
- 提供备用选择器（fallback）
- 记录元素描述和类型

#### 选择器优先级

1. **最高优先级**: `name` 属性选择器（最稳定）
2. **高优先级**: `id` 选择器（如果存在且稳定）
3. **中优先级**: `aria-label`、`aria-labelledby` 属性（语义化）
4. **低优先级**: `class` 选择器（可能变化，需谨慎）
5. **最后选择**: 标签+属性组合选择器

### 3. 操作流程识别

#### 识别常见操作模式

分析页面，识别以下常见操作：

1. **搜索功能**: 搜索框 → 搜索按钮 → 结果列表
2. **登录流程**: 用户名输入 → 密码输入 → 登录按钮
3. **表单提交**: 表单字段填充 → 提交按钮
4. **数据浏览**: 列表/表格 → 分页 → 详情页
5. **筛选排序**: 筛选条件 → 应用按钮 → 结果更新

#### 提取操作步骤

对于每个识别出的操作，提取：
- 操作名称和描述
- 页面路径（URL模式）
- 操作步骤序列
- 每个步骤的目标元素选择器
- 等待条件（如果需要）

### 4. 生成 Skill 文档

#### 文档结构

生成的 MD 文档应包含以下部分：

```markdown
---
name: website-name
description: 网站描述和适用场景
---

# 网站名称 Skill

## 适用页面
- URL模式匹配规则

## 核心操作和 DOM 选择器

### 1. 操作名称
**页面路径**: /path/to/page

**关键元素选择器**:
```javascript
{
  elementName: {
    selector: 'selector',
    description: '元素描述',
    type: 'input|button|link|...',
    fallback: ['备用选择器1', '备用选择器2']
  }
}
```

**操作流程**:
1. 步骤1描述
2. 步骤2描述
...

## 使用指南
...
```

#### 文档生成规则

1. **命名规范**:
   - skill名称：使用网站域名（如 `github-actions`）
   - 元素名称：使用驼峰命名（如 `searchInput`、`loginButton`）

2. **选择器格式**:
   - 优先使用最稳定的选择器
   - 提供多个备用选择器
   - 添加清晰的描述和类型

3. **操作流程**:
   - 步骤清晰、可执行
   - 包含等待条件（如需要）
   - 说明预期结果

4. **文档完整性**:
   - 包含适用页面说明
   - 包含使用指南
   - 包含注意事项

### 5. 生成美观的可视化预览

生成 MD 文档后，可以创建美观的可视化预览，类似截图工具的效果。

#### 可视化预览类型

**类型 1: HTML 卡片预览**

将 skill 的关键信息生成为美观的 HTML 卡片：

```html
<div class="skill-preview-card">
  <div class="skill-header">
    <h2>网站名称 Skill</h2>
    <span class="skill-badge">新创建</span>
  </div>
  <div class="skill-info">
    <div class="info-item">
      <span class="label">适用页面:</span>
      <span class="value">https://example.com/**</span>
    </div>
    <div class="info-item">
      <span class="label">操作数量:</span>
      <span class="value">3 个核心操作</span>
    </div>
  </div>
  <div class="skill-operations">
    <div class="operation-item">
      <span class="operation-icon">🔍</span>
      <span class="operation-name">搜索功能</span>
    </div>
    <div class="operation-item">
      <span class="operation-icon">🔐</span>
      <span class="operation-name">登录表单</span>
    </div>
  </div>
  <div class="skill-actions">
    <button class="btn-download">下载 MD 文件</button>
    <button class="btn-preview">查看完整文档</button>
  </div>
</div>
```

**类型 2: 可视化选择器展示**

将选择器信息生成为可视化的图表或卡片：

```html
<div class="selector-visualization">
  <div class="selector-card">
    <div class="selector-header">
      <span class="selector-name">searchInput</span>
      <span class="selector-type">input</span>
    </div>
    <div class="selector-code">
      <code>input[name="q"]</code>
    </div>
    <div class="selector-fallbacks">
      <span class="fallback-label">备用选择器:</span>
      <code>#search-input</code>
      <code>.search-box input</code>
    </div>
  </div>
</div>
```

**类型 3: 操作流程可视化**

将操作流程生成为步骤流程图：

```html
<div class="workflow-visualization">
  <div class="workflow-step">
    <div class="step-number">1</div>
    <div class="step-content">
      <div class="step-title">定位搜索输入框</div>
      <div class="step-selector">input[name="q"]</div>
    </div>
  </div>
  <div class="workflow-arrow">→</div>
  <div class="workflow-step">
    <div class="step-number">2</div>
    <div class="step-content">
      <div class="step-title">填充搜索关键词</div>
    </div>
  </div>
  <!-- 更多步骤... -->
</div>
```

#### 生成可视化预览的步骤

1. **解析 MD 文档**: 提取关键信息（skill名称、描述、操作列表、选择器等）

2. **生成 HTML 预览**: 使用预定义的模板和样式生成 HTML

3. **添加样式**: 使用内联 CSS 或外部样式表美化预览

4. **添加交互**: 添加下载按钮、展开/折叠等功能

5. **渲染到聊天界面**: 将 HTML 预览作为消息块显示

#### 工具调用示例

生成可视化预览的工具调用：

```json
{
  "tool_name": "generate_skill_preview",
  "arguments": {
    "markdownContent": "MD文档内容",
    "previewType": "card|visualization|workflow",
    "includeDownload": true,
    "style": "modern|minimal|colorful"
  }
}
```

#### 预览样式选项

**现代风格 (modern)**:
- 使用卡片式设计
- 渐变色背景
- 圆角边框
- 阴影效果

**简约风格 (minimal)**:
- 简洁的线条
- 单色配色
- 大量留白
- 清晰的层次

**彩色风格 (colorful)**:
- 丰富的颜色
- 图标和emoji
- 视觉吸引力强
- 适合展示

#### 预览功能特性

1. **关键信息突出**: 高亮显示 skill 名称、操作数量、选择器
2. **代码高亮**: 选择器代码使用语法高亮
3. **交互功能**: 
   - 点击展开/折叠详细信息
   - 一键复制选择器
   - 下载 MD 文件
4. **响应式设计**: 适配不同屏幕尺寸
5. **打印友好**: 支持打印预览

#### 实现建议

1. **使用 HTML Block**: 在聊天消息中使用 `type: 'html'` 的 block
2. **内联样式**: 使用内联 CSS 确保样式独立
3. **JavaScript 交互**: 添加必要的交互功能
4. **文件下载**: 提供下载 MD 文件的功能

#### 预览示例输出

生成的可视化预览应该：
- ✅ 美观易读，类似截图工具的效果
- ✅ 突出关键信息（skill名称、操作、选择器）
- ✅ 提供交互功能（下载、展开、复制）
- ✅ 适配聊天界面样式
- ✅ 可以保存为图片（如需要）

## 使用场景

### 场景 1: 为新网站创建操作 skill

**需求**: 为特定网站创建自动化操作 skill

**操作流程**:
1. 导航到目标网站
2. 调用 `summarize_page` 获取页面摘要
3. 调用 `extract_data` 分析页面结构
4. 探索关键页面（首页、登录页、主要功能页）
5. 识别关键操作和选择器
6. 生成完整的 skill MD 文档

### 场景 2: 更新现有 skill

**需求**: 更新已有 skill 的选择器或操作流程

**操作流程**:
1. 读取现有 skill 文档
2. 访问对应页面
3. 重新分析页面结构
4. 对比新旧选择器
5. 更新 skill 文档

### 场景 3: 批量生成多个页面的 skill

**需求**: 为网站的不同页面分别生成 skill

**操作流程**:
1. 识别网站的主要页面类型
2. 对每个页面类型执行解读流程
3. 生成对应的 skill 文档
4. 整合到统一的 skill 中（如适用）

## 生成文档示例

### 示例：登录页面解读

**输入**: 访问登录页面

**解读结果**:
- 页面标题: "用户登录"
- 识别到表单元素: 用户名输入框、密码输入框、登录按钮
- 识别到操作流程: 填写用户名 → 填写密码 → 点击登录

**生成的 MD 文档**:
```markdown
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
  }
}
```

**操作流程**:
1. 定位用户名输入框：`input[name="username"]`
2. 填充用户名
3. 定位密码输入框：`input[name="password"]`
4. 填充密码
5. 点击登录按钮：`button[type="submit"]`
```

## 最佳实践

### 1. 全面分析页面

- 分析多个相关页面，了解网站整体结构
- 识别不同页面的共同模式和差异
- 提取通用的选择器模式

### 2. 选择器稳定性

- 优先使用不会频繁变化的属性（name、id）
- 避免使用可能变化的 class 名称
- 提供多个备用选择器提高容错性

### 3. 操作流程完整性

- 包含所有必要的步骤
- 说明等待条件（动态加载内容）
- 说明错误处理（如需要）

### 4. 文档可读性

- 使用清晰的结构和标题
- 添加必要的注释和说明
- 提供使用示例

### 5. 验证生成结果

- 检查选择器是否准确
- 验证操作流程是否可执行
- 确保文档格式符合规范

## 注意事项

1. **动态内容**: 某些网站使用 React/Vue 等框架，元素可能是动态加载的，需要在文档中说明等待条件

2. **iframe 处理**: 某些表单可能在 iframe 中，需要在文档中说明

3. **验证码**: 某些操作可能需要处理验证码，需要在文档中说明

4. **URL 匹配**: 确保生成的 URL 匹配规则准确，能正确匹配目标页面

5. **元素等待**: 对于动态加载的内容，在操作流程中说明需要等待元素出现

## 前端显示优化

生成 MD 文档后，为了在前端更好地显示美观的预览效果，需要：

### ⚠️ 重要：不依赖后端格式

**前端集成方案是灵活的，不强制要求后端返回特定格式。**

**推荐方案：前端直接生成预览**（不依赖后端改动）

### 三种实现方案

1. **方案A：前端直接生成**（推荐）
   - AI 生成 MD 文档后，前端解析并生成 HTML 预览
   - ✅ 不依赖后端改动
   - ✅ 前端完全控制样式
   - ✅ 灵活可控

2. **方案B：后端返回 HTML**
   - 后端生成 HTML，前端直接渲染
   - 适合后端已有 HTML 生成能力的情况

3. **方案C：后端返回结构化数据**
   - 后端返回 JSON，前端根据数据生成 HTML
   - 适合前后端协作开发

### 快速实现（方案A - 推荐）

```typescript
// 1. 检测 AI 返回的 MD 文档
const mdMatch = content.match(/```markdown\n([\s\S]*?)\n```/)

// 2. 解析 MD 文档，提取关键信息
const skillData = parseSkillMarkdown(mdMatch[1])

// 3. 在前端生成 HTML 预览
const previewHTML = generateSkillPreviewHTML(skillData)

// 4. 创建预览消息并显示
const message = {
  blocks: [
    { type: 'text', text: '✅ Skill 已生成！' },
    { type: 'html', html: previewHTML, data: { markdownContent: mdMatch[1] } }
  ]
}
```

### 详细实现指南

完整的前端集成实现方案（包含三种方案），请参考：
- [references/frontend-integration.md](references/frontend-integration.md) - 前端集成完整指南
- [references/quick-start-frontend.md](references/quick-start-frontend.md) - 快速开始指南

## 扩展信息

更多详细的解读模式和最佳实践，请参考：
- [references/interpretation-patterns.md](references/interpretation-patterns.md) - 解读模式参考
- [references/selector-strategies.md](references/selector-strategies.md) - 选择器策略参考
- [references/visual-preview.md](references/visual-preview.md) - 可视化预览生成参考
- [references/frontend-integration.md](references/frontend-integration.md) - 前端集成完整指南
