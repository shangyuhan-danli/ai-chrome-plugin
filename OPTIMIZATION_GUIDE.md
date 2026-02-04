# 浏览器插件优化指南

## 概述

本文档说明了对浏览器插件的优化改进，旨在提高元素定位准确性、增强功能通用性，并确保安全性。

## 一、元素定位优化

### 1.1 问题分析

**原有问题：**
- 依赖 `elementId` 定位，页面刷新后失效
- 元素匹配算法简单，容易选错元素
- 缺少元素验证和重定位机制

### 1.2 优化方案

#### 1.2.1 稳定的定位策略

参考 Playwright 最佳实践，实现了优先级定位策略：

1. **Role-based locator** (优先级 10) - 使用 `role` 属性
2. **Label-based locator** (优先级 9) - 使用关联的 `label` 文本
3. **Text-based locator** (优先级 8) - 使用可见文本
4. **Placeholder locator** (优先级 7) - 使用 `placeholder` 属性
5. **Aria-label locator** (优先级 6) - 使用 `aria-label` 属性
6. **Name attribute locator** (优先级 5) - 使用 `name` 属性
7. **Stable CSS selector** (优先级 4) - 基于语义属性的选择器

**实现文件：** `src/content/elementLocator.ts`

#### 1.2.2 智能重定位机制

当 `elementId` 失效时，自动尝试多种定位策略：

```typescript
// 示例：填充输入框时的智能重定位
const el = target.elementId ? getElementById(target.elementId) : null

if (!el) {
  // 1. 尝试使用 selector
  if (target.selector) {
    el = document.querySelector(target.selector)
  }
  
  // 2. 使用描述信息进行语义匹配
  if (!el && target.description) {
    el = locateByDescription(target.description, element.tag)
  }
}
```

#### 1.2.3 元素验证

执行操作前验证元素是否匹配预期：

```typescript
const validation = validateElement(el, expectedElement)
// validation.confidence: 0-100，表示匹配置信度
// validation.valid: 是否有效
```

### 1.3 语义相似度匹配

改进了元素匹配算法，使用文本相似度计算：

- **精确匹配**：+20 分
- **包含匹配**：+10 分
- **部分匹配**：根据字符重叠度计算分数

**实现位置：** `src/content/elementCollector.ts` - `calculateScore()` 函数

## 二、页面总结功能

### 2.1 功能说明

提取页面主要内容，帮助 AI 理解页面整体结构。

### 2.2 实现方式

**方案一：使用 Mozilla Readability（推荐）**

```bash
npm install @mozilla/readability --save
```

**方案二：Fallback 方法**

当 Readability 无法提取时，使用简化算法：
- 查找 `main`, `article`, `[role="main"]` 等主要内容区域
- 提取文本内容，移除脚本和样式
- 生成摘要（前500字符）

**实现文件：** `src/content/pageSummarizer.ts`

### 2.3 使用示例

```typescript
// 工具调用
{
  "tool_name": "summarize_page",
  "arguments": {
    "includeStructuredData": true,
    "includeMetadata": true
  }
}
```

**返回数据：**
```json
{
  "title": "页面标题",
  "content": "主要内容文本",
  "excerpt": "摘要",
  "length": 5000,
  "structuredData": [...],  // JSON-LD, Microdata
  "metadata": {...}         // Meta 标签
}
```

## 三、数据提取功能

### 3.1 支持的数据类型

1. **表格数据** (`table`) - 提取 HTML 表格
2. **列表数据** (`list`) - 提取有序/无序列表
3. **卡片数据** (`cards`) - 提取商品、文章等卡片
4. **表单数据** (`form`) - 提取表单字段

### 3.2 使用示例

```typescript
// 提取表格数据
{
  "tool_name": "extract_data",
  "arguments": {
    "dataType": "table",
    "fields": ["名称", "价格", "库存"]
  }
}

// 提取所有类型数据
{
  "tool_name": "extract_data",
  "arguments": {
    "selector": ".product-list",
    "dataType": "all"
  }
}
```

**实现文件：** `src/content/dataExtractor.ts`

## 四、Skill 机制

### 4.1 设计目标

- **通用性**：支持针对特定网站的专用脚本
- **安全性**：使用沙箱环境，限制危险操作
- **可扩展性**：支持动态加载和更新

### 4.2 安全机制

#### 4.2.1 脚本验证

执行前检查危险操作：

```typescript
const dangerousPatterns = [
  /eval\s*\(/,           // 禁止 eval
  /Function\s*\(/,        // 禁止 Function 构造器
  /document\.write/,      // 禁止直接写入 DOM
  /chrome\./,            // 禁止访问 Chrome API
  /fetch\s*\(/,          // 禁止网络请求（可选）
  // ...
]
```

#### 4.2.2 沙箱执行

使用 iframe sandbox 属性限制权限：

```typescript
iframe.sandbox.add('allow-scripts')  // 只允许脚本执行
// 不允许：allow-same-origin, allow-forms, allow-popups 等
```

#### 4.2.3 超时保护

```typescript
setTimeout(() => {
  reject(new Error('Skill 执行超时'))
}, 10000)  // 10秒超时
```

### 4.3 Skill 定义格式

```typescript
interface Skill {
  id: string              // 唯一标识
  name: string            // 名称
  description: string     // 描述
  version: string          // 版本
  author?: string         // 作者
  matchPatterns?: string[]  // URL 匹配模式，如 ["https://example.com/*"]
  script: string          // JavaScript 代码
  permissions?: string[]  // 需要的权限
  verified?: boolean      // 是否已验证
}
```

### 4.4 使用示例

```typescript
// 注册 Skill
skillManager.registerSkill({
  id: 'taobao-search',
  name: '淘宝搜索优化',
  description: '优化淘宝搜索页面的操作',
  version: '1.0.0',
  matchPatterns: ['https://s.taobao.com/*'],
  script: `
    // 安全的脚本代码
    const searchInput = safeAPI.querySelector('#q');
    if (searchInput) {
      return { found: true, placeholder: searchInput.getAttribute('placeholder') };
    }
    return { found: false };
  `
})

// 执行 Skill
{
  "tool_name": "execute_skill",
  "arguments": {
    "skillId": "taobao-search",
    "context": { "keyword": "iPhone" }
  }
}
```

**实现文件：** `src/content/skillManager.ts`

## 五、最佳实践建议

### 5.1 元素定位

1. **优先使用语义属性**：`role`, `aria-label`, `label` 等
2. **避免使用类名**：CSS 类名容易变化
3. **提供上下文信息**：帮助 AI 区分相似元素
4. **验证元素**：执行前验证元素是否匹配

### 5.2 Skill 开发

1. **只使用安全 API**：通过 `safeAPI` 访问 DOM
2. **避免危险操作**：不要使用 `eval`, `Function` 等
3. **限制作用域**：只操作必要的元素
4. **添加错误处理**：优雅处理异常情况

### 5.3 性能优化

1. **限制元素数量**：默认最多 30 个元素
2. **延迟加载**：按需加载 Skills
3. **缓存结果**：缓存页面总结等耗时操作

## 六、安装依赖

```bash
# 安装页面总结库（可选，有 fallback 方法）
npm install @mozilla/readability --save
```

## 七、后续优化方向

1. **机器学习模型**：使用 ML 模型提高元素匹配准确度
2. **用户反馈机制**：收集用户反馈，持续优化匹配算法
3. **Skill 市场**：建立 Skill 分享平台
4. **可视化编辑器**：提供 Skill 可视化编辑工具

## 八、安全注意事项

1. **Skill 验证**：只使用已验证的 Skills
2. **权限控制**：限制 Skill 的权限范围
3. **审计日志**：记录 Skill 执行日志
4. **用户确认**：敏感操作需要用户确认

## 九、常见问题

### Q1: 为什么元素定位还是不准？

**A:** 请确保：
1. 页面元素有合适的 `label` 或 `aria-label`
2. 提供足够的上下文信息（如区域标题）
3. 使用 `request_more_elements` 获取更多元素信息

### Q2: Skill 执行失败怎么办？

**A:** 检查：
1. Skill 是否匹配当前页面 URL
2. Skill 脚本是否包含危险操作
3. 查看控制台错误信息

### Q3: 如何添加自定义 Skill？

**A:** 通过 `skillManager.registerSkill()` 注册，或通过后台服务动态加载。

## 十、参考资源

- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [Mozilla Readability](https://github.com/mozilla/readability)
- [Web 无障碍指南](https://www.w3.org/WAI/WCAG21/quickref/)
