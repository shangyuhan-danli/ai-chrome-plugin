# 可视化预览生成参考

本文档提供了生成美观 skill 预览的详细指南和模板。

## 预览类型

### 1. 卡片预览 (Card Preview)

最常用的预览类型，以卡片形式展示 skill 的关键信息。

#### HTML 模板

```html
<div class="skill-preview-card" style="
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  margin: 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
">
  <!-- Skill 头部 -->
  <div class="skill-header" style="
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid rgba(255,255,255,0.2);
    padding-bottom: 12px;
  ">
    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
      {{skillName}} Skill
    </h2>
    <span class="skill-badge" style="
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    ">新创建</span>
  </div>

  <!-- Skill 信息 -->
  <div class="skill-info" style="margin-bottom: 20px;">
    <div class="info-item" style="
      display: flex;
      margin-bottom: 12px;
      align-items: center;
    ">
      <span class="label" style="
        font-weight: 600;
        margin-right: 8px;
        min-width: 80px;
        opacity: 0.9;
      ">适用页面:</span>
      <span class="value" style="
        font-family: 'Monaco', 'Courier New', monospace;
        background: rgba(0,0,0,0.2);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 13px;
      ">{{pagePattern}}</span>
    </div>
    <div class="info-item" style="
      display: flex;
      margin-bottom: 12px;
      align-items: center;
    ">
      <span class="label" style="
        font-weight: 600;
        margin-right: 8px;
        min-width: 80px;
        opacity: 0.9;
      ">操作数量:</span>
      <span class="value" style="font-size: 14px;">{{operationCount}} 个核心操作</span>
    </div>
    <div class="info-item" style="
      display: flex;
      margin-bottom: 12px;
      align-items: center;
    ">
      <span class="label" style="
        font-weight: 600;
        margin-right: 8px;
        min-width: 80px;
        opacity: 0.9;
      ">选择器数量:</span>
      <span class="value" style="font-size: 14px;">{{selectorCount}} 个选择器</span>
    </div>
  </div>

  <!-- 操作列表 -->
  <div class="skill-operations" style="margin-bottom: 24px;">
    <div style="font-weight: 600; margin-bottom: 12px; opacity: 0.9;">核心操作:</div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      {{#each operations}}
      <div class="operation-item" style="
        background: rgba(255,255,255,0.15);
        padding: 8px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
      ">
        <span class="operation-icon" style="font-size: 16px;">{{icon}}</span>
        <span class="operation-name" style="font-size: 14px;">{{name}}</span>
      </div>
      {{/each}}
    </div>
  </div>

  <!-- 操作按钮 -->
  <div class="skill-actions" style="
    display: flex;
    gap: 12px;
    border-top: 2px solid rgba(255,255,255,0.2);
    padding-top: 16px;
  ">
    <button class="btn-download" onclick="downloadSkillFile()" style="
      flex: 1;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
       onmouseout="this.style.background='rgba(255,255,255,0.2)'">
      📥 下载 MD 文件
    </button>
    <button class="btn-preview" onclick="toggleFullPreview()" style="
      flex: 1;
      background: white;
      border: none;
      color: #667eea;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
    " onmouseover="this.style.opacity='0.9'" 
       onmouseout="this.style.opacity='1'">
      👁️ 查看完整文档
    </button>
  </div>
</div>
```

### 2. 选择器可视化 (Selector Visualization)

以卡片形式展示每个选择器的详细信息。

#### HTML 模板

```html
<div class="selector-visualization" style="margin: 16px 0;">
  {{#each selectors}}
  <div class="selector-card" style="
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s;
  " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" 
     onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
    
    <!-- 选择器头部 -->
    <div class="selector-header" style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="selector-icon" style="
          font-size: 20px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          border-radius: 6px;
        ">{{typeIcon}}</span>
        <span class="selector-name" style="
          font-weight: 600;
          font-size: 16px;
          color: #333;
        ">{{name}}</span>
      </div>
      <span class="selector-type" style="
        background: #667eea;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      ">{{type}}</span>
    </div>

    <!-- 选择器代码 -->
    <div class="selector-code" style="
      background: #f8f9fa;
      border-left: 3px solid #667eea;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 12px;
    ">
      <div style="
        font-size: 11px;
        color: #666;
        margin-bottom: 4px;
        font-weight: 500;
      ">主选择器:</div>
      <code style="
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        color: #e83e8c;
        background: transparent;
      ">{{selector}}</code>
      <button onclick="copySelector('{{selector}}')" style="
        float: right;
        background: #667eea;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      ">复制</button>
    </div>

    <!-- 描述 -->
    <div class="selector-description" style="
      color: #666;
      font-size: 14px;
      margin-bottom: 12px;
    ">
      {{description}}
    </div>

    <!-- 备用选择器 -->
    {{#if fallback}}
    <div class="selector-fallbacks" style="
      border-top: 1px solid #e0e0e0;
      padding-top: 12px;
    ">
      <div style="
        font-size: 12px;
        color: #999;
        margin-bottom: 8px;
        font-weight: 500;
      ">备用选择器:</div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        {{#each fallback}}
        <code style="
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: 'Monaco', 'Courier New', monospace;
          color: #666;
        ">{{this}}</code>
        {{/each}}
      </div>
    </div>
    {{/if}}
  </div>
  {{/each}}
</div>
```

### 3. 操作流程可视化 (Workflow Visualization)

以流程图形式展示操作步骤。

#### HTML 模板

```html
<div class="workflow-visualization" style="
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 16px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
">
  <h3 style="
    margin: 0 0 24px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  ">
    <span>📋</span>
    <span>操作流程</span>
  </h3>
  
  <div style="display: flex; flex-direction: column; gap: 16px;">
    {{#each steps}}
    <div style="display: flex; align-items: center; gap: 12px;">
      <!-- 步骤编号 -->
      <div class="step-number" style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
        flex-shrink: 0;
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
      ">{{@index}}</div>
      
      <!-- 步骤内容 -->
      <div class="step-content" style="
        flex: 1;
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      ">
        <div class="step-title" style="
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          font-size: 15px;
        ">{{title}}</div>
        {{#if selector}}
        <div class="step-selector" style="
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          color: #e83e8c;
          background: white;
          padding: 6px 10px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 4px;
        ">{{selector}}</div>
        {{/if}}
      </div>
      
      <!-- 箭头 -->
      {{#unless @last}}
      <div class="workflow-arrow" style="
        font-size: 24px;
        color: #667eea;
        flex-shrink: 0;
      ">↓</div>
      {{/unless}}
    </div>
    {{/each}}
  </div>
</div>
```

## 样式主题

### 现代风格 (Modern)

```css
.skill-preview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
```

### 简约风格 (Minimal)

```css
.skill-preview-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
```

### 彩色风格 (Colorful)

```css
.skill-preview-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%);
  border-radius: 16px;
  padding: 28px;
  color: white;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}
```

## JavaScript 辅助函数

### 下载文件

```javascript
function downloadSkillFile(markdownContent, filename) {
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `skill_${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### 复制选择器

```javascript
function copySelector(selector) {
  navigator.clipboard.writeText(selector).then(() => {
    // 显示复制成功提示
    showToast('选择器已复制到剪贴板');
  });
}
```

### 切换预览

```javascript
function toggleFullPreview() {
  const fullPreview = document.getElementById('full-preview');
  if (fullPreview.style.display === 'none') {
    fullPreview.style.display = 'block';
  } else {
    fullPreview.style.display = 'none';
  }
}
```

## 生成预览的步骤

1. **解析 MD 文档**: 提取 frontmatter、操作列表、选择器等信息

2. **选择预览类型**: 根据内容选择卡片、可视化或流程图

3. **填充模板**: 使用模板引擎（如 Handlebars）填充数据

4. **应用样式**: 根据选择的主题应用样式

5. **添加交互**: 添加 JavaScript 交互功能

6. **渲染到界面**: 将生成的 HTML 插入到聊天消息中

## 最佳实践

1. **响应式设计**: 确保预览在不同屏幕尺寸下正常显示

2. **性能优化**: 避免过大的 HTML 结构，保持简洁

3. **可访问性**: 使用语义化 HTML 和适当的 ARIA 标签

4. **交互反馈**: 为按钮和链接添加 hover 效果和点击反馈

5. **错误处理**: 处理数据缺失的情况，提供默认值

6. **样式隔离**: 使用内联样式或 scoped CSS 避免样式冲突

## 示例：完整预览生成

```javascript
function generateSkillPreview(skillData) {
  const { name, description, operations, selectors, pagePattern } = skillData;
  
  // 生成卡片预览
  const cardHTML = `
    <div class="skill-preview-card" style="...">
      <!-- 卡片内容 -->
    </div>
  `;
  
  // 生成选择器可视化
  const selectorHTML = selectors.map(selector => `
    <div class="selector-card" style="...">
      <!-- 选择器内容 -->
    </div>
  `).join('');
  
  // 生成操作流程
  const workflowHTML = operations.map((op, index) => `
    <div class="workflow-step">
      <!-- 步骤内容 -->
    </div>
  `).join('');
  
  return {
    card: cardHTML,
    selectors: selectorHTML,
    workflow: workflowHTML,
    fullHTML: cardHTML + selectorHTML + workflowHTML
  };
}
```

## 集成到聊天界面

生成的预览可以作为 HTML block 添加到聊天消息中：

```javascript
const previewMessage = {
  sessionId: currentSessionId,
  role: 'assistant',
  blocks: [
    {
      type: 'text',
      text: '✅ Skill 文档已生成！'
    },
    {
      type: 'html',
      html: previewHTML,
      style: 'skill-preview'
    }
  ],
  createdAt: Date.now()
};
```
