# AI 网页操作助手 - 设计方案

## 一、概述

### 1.1 背景

当前浏览器插件提供了 AI 对话能力，但未充分发挥浏览器插件的独特优势。本方案旨在让 AI 能够直接操作网页元素，实现：

- 自动填充表单
- 点击按钮/链接
- 高亮/标注文字
- 选择下拉选项
- 其他 DOM 操作

用户通过自然语言描述需求，AI 理解意图后执行相应操作。

### 1.2 核心思路

```
感知层 → 决策层 → 执行层

1. 感知层：获取当前页面的可交互元素信息
2. 决策层：AI 根据用户自然语言指令，决定执行什么操作
3. 执行层：Content Script 执行具体的 DOM 操作
```

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户输入                              │
│              "帮我把搜索框填上 iPhone 16 然后点搜索"          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Chat App (前端)                          │
│  1. 收集页面元素信息 (通过 Content Script)                    │
│  2. 将用户指令 + 页面上下文 发送给后端                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端 AI Agent                            │
│  1. 理解用户意图                                             │
│  2. 生成操作指令 (Tool Call)                                 │
│  3. 返回结构化的操作命令                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Content Script (执行)                      │
│  1. 解析操作命令                                             │
│  2. 定位目标元素                                             │
│  3. 执行操作 (填充/点击/高亮等)                               │
│  4. 返回执行结果                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、支持的操作类型

| 操作类型 | 说明 | 示例指令 |
|---------|------|---------|
| `fill` | 填充输入框 | "在搜索框输入 xxx" |
| `click` | 点击按钮/链接 | "点击提交按钮" |
| `highlight` | 高亮文字 | "把第二段标黄" |
| `underline` | 添加下划线 | "给标题加下划线" |
| `select` | 选择下拉选项 | "选择北京市" |
| `check` | 勾选复选框 | "勾选同意协议" |
| `scroll` | 滚动页面 | "滚动到页面底部" |
| `read` | 读取内容 | "这个表格里有什么" |

---

## 四、核心数据结构

### 4.1 页面元素描述 (发送给 AI)

```typescript
interface PageElement {
  id: string              // 唯一标识 (生成的)
  tag: string             // 标签名: input, button, a, select...
  type?: string           // input 类型: text, password, submit...
  text?: string           // 可见文本
  placeholder?: string    // 占位符
  label?: string          // 关联的 label 文本
  ariaLabel?: string      // 无障碍标签
  name?: string           // name 属性
  value?: string          // 当前值
  rect: {                 // 位置信息
    x: number
    y: number
    width: number
    height: number
  }
  visible: boolean        // 是否可见
  disabled: boolean       // 是否禁用
}

interface PageContext {
  url: string
  title: string
  elements: PageElement[]  // 可交互元素列表
  selectedText?: string    // 用户选中的文字
}
```

### 4.2 AI 返回的操作指令

```typescript
interface PageAction {
  action: 'fill' | 'click' | 'highlight' | 'underline' |
          'select' | 'check' | 'scroll' | 'read'
  target: {
    elementId?: string     // 元素ID
    selector?: string      // CSS选择器 (备用)
    description?: string   // 元素描述 (用于确认)
  }
  params?: {
    value?: string         // 填充的值
    color?: string         // 高亮颜色
    direction?: 'up' | 'down' | 'top' | 'bottom'
  }
}
```

### 4.3 精简元素格式 (优化 Token)

```typescript
// 发送给 AI 的精简版本
interface CompactElement {
  id: string
  desc: string  // 合并的描述: "输入框:用户名" / "按钮:登录"
}

// 示例
{
  "page": "淘宝网 - 首页",
  "url": "https://www.taobao.com",
  "elements": [
    { "id": "e1", "desc": "输入框:搜索(placeholder:搜索)" },
    { "id": "e2", "desc": "按钮:搜索" },
    { "id": "e3", "desc": "链接:登录" }
  ]
}
```

---

## 五、Token 优化方案

### 5.1 问题

一个复杂页面可能有几百个可交互元素，全部发送会消耗大量 Token（5000-50000）。

### 5.2 解决方案：智能筛选 + 按需补充

```
┌─────────────────────────────────────────────────────────────┐
│  第一层：智能筛选 (少量 token)                                │
│  ├─ 基于指令关键词筛选相关元素                                │
│  ├─ 只发送视口内 + 高优先级元素                               │
│  └─ 发送页面摘要 + 精选元素列表 (~500 tokens)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  第二层：按需补充 (AI 主动请求)                               │
│  ├─ AI 发现信息不足，请求特定区域元素                         │
│  └─ "请提供表单区域的详细元素"                                │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 智能筛选策略

```typescript
interface FilterStrategy {
  // 元素优先级权重
  priorities: {
    form: 10,        // 表单元素最高
    button: 8,       // 按钮次之
    link: 3,         // 链接较低
    text: 1          // 纯文本最低
  }

  // 位置权重
  viewport: {
    visible: 5,      // 视口内
    nearViewport: 2, // 视口附近
    hidden: 0        // 不可见
  }

  // 最大元素数量
  maxElements: 30
}
```

### 5.4 筛选算法

```typescript
function smartFilter(elements: PageElement[], userMessage: string): PageElement[] {
  // 1. 从用户指令提取关键词
  const keywords = extractKeywords(userMessage)
  // "帮我填写用户名和密码" → ["填写", "用户名", "密码"]

  // 2. 计算每个元素的相关性得分
  const scored = elements.map(el => ({
    element: el,
    score: calculateScore(el, keywords)
  }))

  // 3. 按得分排序，取 top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map(s => s.element)
}

function calculateScore(el: PageElement, keywords: string[]): number {
  let score = 0

  // 关键词匹配
  const text = [el.text, el.placeholder, el.label, el.ariaLabel].join(' ')
  for (const kw of keywords) {
    if (text.includes(kw)) score += 10
  }

  // 元素类型权重
  if (el.tag === 'input' || el.tag === 'textarea') score += 8
  if (el.tag === 'button') score += 6
  if (el.tag === 'select') score += 6
  if (el.tag === 'a') score += 2

  // 视口权重
  if (el.visible) score += 5

  return score
}
```

### 5.5 按需补充 Tool

```typescript
// AI 可调用的 Tool
{
  name: "request_more_elements",
  description: "当前元素信息不足时，请求特定区域或类型的元素",
  parameters: {
    region: {
      type: "string",
      description: "区域描述: 'form', 'header', 'sidebar', 'below_viewport'"
    },
    elementType: {
      type: "string",
      description: "元素类型: 'input', 'button', 'link', 'all'"
    },
    keyword: {
      type: "string",
      description: "关键词筛选"
    }
  }
}
```

### 5.6 Token 消耗对比

| 方案 | Token 消耗 | 适用场景 |
|-----|-----------|---------|
| 智能筛选 | ~500-1000 | 通用场景 |
| 按需补充 | +200/次 | 复杂页面 |
| 全量发送 | 5000-50000 | 不推荐 |

---

## 六、新增模块设计

### 6.1 元素采集器

**文件**: `src/content/elementCollector.ts`

```typescript
// 职责：扫描页面，提取可交互元素

// 采集所有可交互元素
export function collectInteractiveElements(): PageElement[]

// 根据 ID 获取实际 DOM 元素
export function getElementById(id: string): HTMLElement | null

// 智能筛选元素
export function filterElements(
  elements: PageElement[],
  userMessage: string
): PageElement[]

// 生成精简格式
export function toCompactFormat(elements: PageElement[]): CompactElement[]
```

### 6.2 操作执行器

**文件**: `src/content/actionExecutor.ts`

```typescript
// 职责：执行具体的 DOM 操作

interface ActionResult {
  success: boolean
  message: string
  error?: string
}

export async function executeAction(action: PageAction): Promise<ActionResult> {
  switch (action.action) {
    case 'fill':
      return fillInput(action.target, action.params?.value)
    case 'click':
      return clickElement(action.target)
    case 'highlight':
      return highlightText(action.target, action.params?.color)
    case 'underline':
      return underlineText(action.target)
    case 'select':
      return selectOption(action.target, action.params?.value)
    case 'check':
      return checkBox(action.target)
    case 'scroll':
      return scrollPage(action.params?.direction)
    case 'read':
      return readContent(action.target)
  }
}
```

### 6.3 新增消息类型

```typescript
// 新增的 Chrome Runtime 消息类型
type NewMessageType =
  | 'GET_PAGE_ELEMENTS'      // 获取页面元素
  | 'EXECUTE_ACTION'         // 执行操作
  | 'GET_SELECTED_TEXT'      // 获取选中文字
  | 'REQUEST_MORE_ELEMENTS'  // 请求更多元素
```

---

## 七、交互流程

### 7.1 完整流程

```
用户: "帮我在用户名输入框填 zhangsan，密码填 123456，然后点登录"

1. [Chat App] 请求 Content Script 采集页面元素

2. [Content Script] 智能筛选后返回:
   {
     page: "登录页面",
     elements: [
       { id: "e1", desc: "输入框:用户名(placeholder:请输入用户名)" },
       { id: "e2", desc: "输入框:密码(type:password)" },
       { id: "e3", desc: "按钮:登录" }
     ]
   }

3. [Chat App] 发送给后端:
   {
     message: "帮我在用户名输入框填 zhangsan，密码填 123456，然后点登录",
     pageContext: { ... }
   }

4. [后端 AI] 返回 Tool Call:
   {
     tool: "page_action",
     actions: [
       { action: "fill", target: { elementId: "e1" }, params: { value: "zhangsan" } },
       { action: "fill", target: { elementId: "e2" }, params: { value: "123456" } },
       { action: "click", target: { elementId: "e3" } }
     ]
   }

5. [Chat App] 显示操作预览，等待用户确认

6. [Content Script] 依次执行操作，返回结果

7. [Chat App] 显示: "已完成：填写用户名、填写密码、点击登录按钮"
```

### 7.2 按需补充流程

```
用户: "帮我提交这个表单"

AI 收到的初始信息:
{
  "page": "注册页面",
  "elements": [
    { "id": "e1", "desc": "输入框:用户名" },
    { "id": "e2", "desc": "输入框:密码" }
    // 只有 30 个元素，没有提交按钮
  ]
}

AI: 我看到了用户名和密码输入框，但没看到提交按钮。
    让我请求更多表单区域的元素。

AI 调用: request_more_elements({ region: "form", elementType: "button" })

系统返回:
{
  "elements": [
    { "id": "e31", "desc": "按钮:注册" },
    { "id": "e32", "desc": "按钮:重置" }
  ]
}

AI: 找到了注册按钮，现在执行提交操作...
```

---

## 八、安全考虑

### 8.1 风险与应对

| 风险 | 应对措施 |
|-----|---------|
| 敏感操作 | 涉及密码、支付、删除等操作前需用户确认 |
| 恶意网站 | 可配置网站黑名单/白名单 |
| 误操作 | 操作前显示预览，支持撤销 |
| 隐私泄露 | 密码框内容不发送给 AI，只发送元素描述 |
| 删除类操作 | 默认禁止，需用户在设置中开启 |

### 8.2 敏感操作定义

```typescript
const sensitiveActions = {
  // 需要确认的操作
  requireConfirm: [
    'delete',      // 删除
    'submit',      // 提交表单
    'payment',     // 支付相关
    'password',    // 密码相关
  ],

  // 默认禁止的操作
  forbidden: [
    'delete_account',  // 删除账号
    'clear_all',       // 清空所有
  ]
}
```

### 8.3 操作确认 UI

```typescript
interface ActionConfirmation {
  actions: PageAction[]
  descriptions: string[]  // 人类可读的操作描述
  risks: string[]         // 风险提示
}

// 示例
{
  actions: [...],
  descriptions: [
    "在用户名输入框填写 'zhangsan'",
    "在密码输入框填写 '******'",
    "点击登录按钮"
  ],
  risks: ["将提交登录表单"]
}
```

---

## 九、需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| `src/content/index.ts` | 添加元素采集和操作执行的消息处理 |
| `src/background/index.ts` | 添加新消息类型的路由 |
| `src/chat/App.vue` | 添加操作预览 UI、确认按钮、执行结果展示 |
| `src/utils/types.ts` | 添加 PageElement、PageAction、ActionResult 等类型 |
| `src/utils/api.ts` | 添加页面上下文到聊天请求 |

### 新增文件

| 文件 | 说明 |
|-----|------|
| `src/content/elementCollector.ts` | 元素采集逻辑 |
| `src/content/actionExecutor.ts` | 操作执行逻辑 |
| `src/content/actionStyles.css` | 高亮、下划线等样式 |

---

## 十、后端配合要求

### 10.1 新增 Tool 定义

后端 Agent 需要新增 `page_action` Tool：

```json
{
  "name": "page_action",
  "description": "在用户当前浏览的网页上执行操作，如填充输入框、点击按钮、高亮文字等",
  "parameters": {
    "type": "object",
    "properties": {
      "actions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "enum": ["fill", "click", "highlight", "underline", "select", "check", "scroll", "read"]
            },
            "target": {
              "type": "object",
              "properties": {
                "elementId": { "type": "string" },
                "selector": { "type": "string" },
                "description": { "type": "string" }
              }
            },
            "params": {
              "type": "object",
              "properties": {
                "value": { "type": "string" },
                "color": { "type": "string" },
                "direction": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

### 10.2 新增 Tool: request_more_elements

```json
{
  "name": "request_more_elements",
  "description": "当前页面元素信息不足时，请求特定区域或类型的更多元素",
  "parameters": {
    "type": "object",
    "properties": {
      "region": {
        "type": "string",
        "description": "区域: form, header, sidebar, footer, below_viewport"
      },
      "elementType": {
        "type": "string",
        "description": "元素类型: input, button, link, select, all"
      },
      "keyword": {
        "type": "string",
        "description": "关键词筛选"
      }
    }
  }
}
```

### 10.3 System Prompt 补充

建议在 Agent 的 system prompt 中添加：

```
当用户请求操作网页时，你会收到页面元素的精简描述。
根据用户意图，生成 page_action 工具调用。

注意事项：
1. 优先使用 elementId 定位元素
2. 如果找不到目标元素，使用 request_more_elements 请求更多信息
3. 对于敏感操作（删除、支付），在 description 中说明风险
4. 支持批量操作，按顺序执行
```

---

## 十一、实现优先级

### Phase 1: 基础能力
- [ ] 元素采集器 (elementCollector.ts)
- [ ] 基础操作执行 (fill, click)
- [ ] 消息通信机制
- [ ] 简单的操作确认 UI

### Phase 2: 完善操作
- [ ] 更多操作类型 (highlight, underline, select, check)
- [ ] 智能筛选算法
- [ ] 按需补充机制
- [ ] 操作结果反馈

### Phase 3: 安全与体验
- [ ] 敏感操作确认
- [ ] 操作预览
- [ ] 撤销功能
- [ ] 错误处理优化

---

## 十二、附录

### A. 元素选择器优先级

```
1. elementId (最可靠，由前端生成并缓存映射)
2. data-testid / data-id (如果页面有)
3. id 属性
4. name 属性
5. CSS 选择器组合 (tag + class + 位置)
```

### B. 支持的 HTML 元素

```
可交互元素:
- input (text, password, email, number, search, tel, url)
- textarea
- button
- a (链接)
- select / option
- input[type=checkbox]
- input[type=radio]
- [contenteditable=true]

可标注元素:
- p, span, div, h1-h6, li, td, th
- 任何包含文本的元素
```
