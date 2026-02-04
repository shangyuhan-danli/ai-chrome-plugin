---
name: web-content-extraction
description: 从网页中智能提取结构化数据、主要内容、表格、列表等，并进行智能分析和处理。这个功能在浏览器中有不可替代的优势：可以处理JavaScript渲染的内容、需要登录的页面、动态加载的内容、实时交互等。适用于数据采集、内容分析、信息整理等场景。
---

# 网页内容智能提取 Skill

## 📖 文档说明

**本 skill 文档是给 AI 读取的指导文档，用于指导 AI 如何操作网页。**

**执行流程**:
1. 后台服务读取 skill MD 文件 → AI 理解操作方式
2. AI 根据 skill 指导 → 生成工具调用（如 `page_action`、`extract_data`）
3. 浏览器插件接收工具调用 → 执行实际操作

**文档中的示例**:
- 代码示例：仅用于说明操作逻辑，不是实际执行的代码
- 工具调用示例（JSON格式）：展示 AI 应该如何调用工具

---

本 skill 提供了从网页中智能提取结构化数据的能力，充分利用浏览器环境的优势，处理命令行和API无法处理的复杂场景。

## 🌟 为什么浏览器环境不可替代？

### 浏览器环境的独特优势

| 场景 | 命令行/API | 浏览器环境 | 优势 |
|------|-----------|-----------|------|
| **JavaScript渲染内容** | ❌ 需要无头浏览器 | ✅ 原生支持 | 直接访问渲染后的DOM |
| **需要登录的页面** | ❌ 需要处理Cookie/Session | ✅ 使用已有登录状态 | 自动使用浏览器Cookie |
| **动态加载内容** | ❌ 需要等待和重试 | ✅ 可以等待和交互 | 可以滚动、点击加载更多 |
| **SPA单页应用** | ❌ 需要模拟交互 | ✅ 真实交互 | 可以点击、导航、等待 |
| **实时可视化** | ❌ 无法看到效果 | ✅ 可以高亮、标注 | 实时看到提取结果 |
| **复杂交互流程** | ❌ 难以处理 | ✅ 可以完整模拟 | 处理验证码、OAuth等 |

## 重要说明

**本 skill 文档是给 AI 读取的指导文档，不是执行代码。**

- Skill MD 文件 → 后台服务读取 → AI 理解操作方式
- AI 根据 skill 指导 → 生成 `page_action` 工具调用 → 浏览器插件执行

文档中的代码示例仅用于说明操作逻辑，实际执行通过 `page_action` 工具调用完成。

## 核心功能

### 1. 智能内容提取

#### 提取主要内容

从网页中提取核心内容，去除广告、导航等噪音。

**使用方式**: 调用 `summarize_page` 工具（浏览器插件内置工具）

**返回结果**: `{ title, content, excerpt, length, siteName }`

**优势**:
- 使用 Mozilla Readability 算法，准确提取正文
- 自动去除广告、导航、侧边栏等噪音
- 保留页面结构和格式

#### 提取结构化数据

提取页面中的结构化数据（JSON-LD、Microdata、RDFa）。

**使用方式**: 调用 `summarize_page` 工具，设置 `includeStructuredData: true`

**返回结果**: `[{ "@type": "Article", "headline": "...", ... }]`

**优势**:
- 提取商品信息、文章信息、事件信息等
- 支持多种结构化数据格式
- 自动解析嵌套结构

### 2. 数据提取

#### 提取表格数据

从HTML表格中提取结构化数据。

**使用方式**: 调用 `extract_data` 工具（浏览器插件内置工具）

**工具调用示例**:
```json
{
  "tool_name": "extract_data",
  "arguments": {
    "dataType": "table",
    "selector": ".data-table",
    "fields": ["名称", "价格", "库存"]
  }
}
```

**返回结果**: `{ type: 'table', data: [...], fields: [...], count: 10 }`

**优势**:
- 自动识别表头和数据行
- 提取链接、图片等关联数据
- 支持多个表格合并

#### 提取列表数据

从无序/有序列表中提取数据。

**工具调用示例**:
```json
{
  "tool_name": "extract_data",
  "arguments": {
    "dataType": "list",
    "selector": ".product-list"
  }
}
```

**返回结果**: `{ type: 'list', data: [...], count: 20 }`

**优势**:
- 提取列表项文本、链接、图片
- 支持嵌套列表
- 自动编号

#### 提取卡片数据

从商品列表、文章列表等卡片布局中提取数据。

**工具调用示例**:
```json
{
  "tool_name": "extract_data",
  "arguments": {
    "dataType": "cards",
    "selector": ".product-grid"
  }
}
```

**返回结果**: `{ type: 'cards', data: [{ title, description, image, price, link }], count: 12 }`

**优势**:
- 智能识别卡片结构
- 提取标题、描述、图片、价格、链接等
- 支持多种卡片布局模式

### 3. 智能处理流程

#### 处理动态加载内容

对于需要滚动或点击"加载更多"的页面，使用 `page_action` 工具执行操作序列：

**工具调用示例**:
```json
{
  "tool_name": "page_action",
  "arguments": {
    "actions": [
      {
        "action": "scroll",
        "target": {},
        "params": { "direction": "down", "amount": 1000 }
      },
      {
        "action": "wait",
        "target": { "selector": ".new-item" },
        "params": { "timeout": 3000 }
      },
      {
        "action": "click",
        "target": { "selector": ".load-more-button" }
      },
      {
        "action": "wait",
        "params": { "timeout": 2000 }
      }
    ]
  }
}
```

然后调用 `extract_data` 工具提取数据。

#### 处理需要登录的页面

利用浏览器已有的登录状态：

**操作流程**:
1. 用户已在浏览器中登录（使用浏览器Cookie）
2. 直接访问需要登录的页面（使用 `page_action` 的 `navigate` 操作）
3. 调用 `extract_data` 工具提取数据（自动使用登录状态）

**优势**: 无需处理Cookie、Session等复杂逻辑，浏览器插件自动使用当前登录状态

#### 处理SPA单页应用

对于React、Vue等单页应用，先等待加载，再导航，最后提取：

**工具调用示例**:
```json
{
  "tool_name": "page_action",
  "arguments": {
    "actions": [
      {
        "action": "wait",
        "target": { "selector": "[data-reactroot]" },
        "params": { "timeout": 5000 }
      },
      {
        "action": "click",
        "target": { "selector": "a[href*='/products']" }
      },
      {
        "action": "wait",
        "params": { "timeout": 3000 }
      }
    ]
  }
}
```

然后调用 `extract_data` 工具提取数据。

## 使用场景

### 场景 1: 商品价格监控

**需求**: 监控多个电商网站的商品价格变化

**浏览器优势**:
- ✅ 可以处理需要登录的页面（如会员价格）
- ✅ 可以处理JavaScript动态加载的价格
- ✅ 可以实时看到价格变化

**操作流程**:
1. 使用 `page_action` 导航到商品页面（自动使用浏览器登录状态）
2. 等待价格加载（使用 `wait` 操作）
3. 调用 `extract_data` 工具提取价格信息：
   ```json
   {
     "tool_name": "extract_data",
     "arguments": {
       "selector": ".product-price",
       "dataType": "cards"
     }
   }
   ```
4. AI 处理返回的数据，保存并对比历史价格

### 场景 2: 新闻文章批量采集

**需求**: 从新闻网站批量采集文章内容

**浏览器优势**:
- ✅ 可以处理需要登录的付费内容
- ✅ 可以处理动态加载的文章列表
- ✅ 可以提取完整的文章内容（去除广告）

**操作流程**:
1. 使用 `page_action` 滚动页面加载更多文章
2. 调用 `extract_data` 提取文章列表：
   ```json
   {
     "tool_name": "extract_data",
     "arguments": {
       "dataType": "cards",
       "selector": ".article-list"
     }
   }
   ```
3. 对每个文章链接，使用 `page_action` 导航
4. 调用 `summarize_page` 工具提取文章内容

### 场景 3: 数据表格导出

**需求**: 从网页表格中提取数据并导出为Excel

**浏览器优势**:
- ✅ 可以处理需要交互的表格（排序、筛选）
- ✅ 可以处理分页表格（点击下一页）
- ✅ 可以实时看到提取的数据

**操作流程**:
1. 如果需要，使用 `page_action` 进行筛选/排序操作
2. 调用 `extract_data` 提取第一页数据
3. 循环处理后续页面：
   - 使用 `page_action` 点击下一页
   - 等待页面加载
   - 调用 `extract_data` 提取数据
4. AI 处理所有数据，生成Excel格式（或返回JSON供用户处理）

### 场景 4: 竞品分析

**需求**: 对比多个竞品网站的功能和价格

**浏览器优势**:
- ✅ 可以同时打开多个标签页对比
- ✅ 可以实时看到提取的数据
- ✅ 可以高亮关键信息

**流程**:
```javascript
// 1. 打开多个竞品网站
// 2. 提取每个网站的产品信息
const competitor1 = extractData({ dataType: 'cards' })
const competitor2 = extractData({ dataType: 'cards' })
// 3. 对比分析
compareProducts(competitor1, competitor2)
```

## 与其他方式的对比

### vs 命令行爬虫（如 Scrapy）

| 功能 | 命令行爬虫 | 浏览器环境 |
|------|-----------|-----------|
| JavaScript渲染 | ❌ 需要无头浏览器 | ✅ 原生支持 |
| 登录状态 | ❌ 需要处理Cookie | ✅ 自动使用 |
| 动态内容 | ❌ 需要等待逻辑 | ✅ 可以交互等待 |
| 实时可视化 | ❌ 无法看到 | ✅ 可以高亮标注 |
| 复杂交互 | ❌ 难以处理 | ✅ 完整支持 |
| 开发复杂度 | 高 | 低 |

### vs API调用

| 功能 | API调用 | 浏览器环境 |
|------|---------|-----------|
| 需要登录 | ❌ 需要API密钥 | ✅ 使用浏览器登录 |
| 公开数据 | ✅ 可以 | ✅ 可以 |
| 私有数据 | ❌ 无法访问 | ✅ 可以访问 |
| 实时交互 | ❌ 无法 | ✅ 可以 |
| 可视化 | ❌ 无法 | ✅ 可以 |

## 最佳实践

### 1. 等待内容加载

对于动态加载的内容，始终先等待：

```javascript
{
  action: 'wait',
  target: { selector: '.data-container' },
  params: { timeout: 5000 }
}
```

### 2. 处理分页

对于分页数据，循环提取：

```javascript
let page = 1
let allData = []

while (true) {
  const data = extractData({ dataType: 'table' })
  allData.push(...data.data)
  
  if (!hasNextPage()) break
  
  clickNextPage()
  waitForPageLoad()
  page++
}
```

### 3. 错误处理

添加错误处理和重试机制：

```javascript
try {
  const data = extractData({ dataType: 'table' })
  if (data.count === 0) {
    // 尝试其他选择器
    const altData = extractData({ 
      selector: '.alternative-table',
      dataType: 'table' 
    })
    return altData
  }
  return data
} catch (error) {
  console.error('提取失败:', error)
  // 重试或使用备用方案
}
```

## 扩展信息

更多详细的数据提取和处理模式，请参考：
- [references/extraction-patterns.md](references/extraction-patterns.md) - 提取模式参考
- [references/processing-workflows.md](references/processing-workflows.md) - 处理流程示例
