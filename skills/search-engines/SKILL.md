---
name: search-engines
description: 在常见搜索网站（百度、Google、Bing、搜狗等）上执行搜索操作。包含预定义的 DOM 选择器信息，让 AI 能够精准定位搜索框和搜索按钮，提高操作准确性和效率。适用于所有主流搜索引擎网站。
---

# 搜索引擎操作 Skill

本 skill 提供了主流搜索引擎网站的 DOM 选择器信息，帮助 AI 更精准地操作搜索框和执行搜索，避免每次都需要搜索和描述元素，从而节约 token 并提高准确性。

## 适用页面

- `https://www.baidu.com/**` - 百度搜索
- `https://www.google.com/**` - Google 搜索
- `https://www.bing.com/**` - Bing 搜索
- `https://www.sogou.com/**` - 搜狗搜索
- `https://www.yahoo.com/**` - Yahoo 搜索
- `https://www.duckduckgo.com/**` - DuckDuckGo 搜索

## 核心操作和 DOM 选择器

### 1. 百度搜索

**页面路径**: `https://www.baidu.com/` 或 `https://www.baidu.com/s`

**关键元素选择器**:

```javascript
{
  // 搜索输入框（最稳定的选择器）
  searchInput: {
    selector: '#kw',
    description: '百度搜索输入框',
    type: 'input',
    fallback: [
      'input[name="wd"]',
      'input[type="text"][id="kw"]',
      '.s_ipt'
    ]
  },
  
  // 搜索按钮
  searchButton: {
    selector: '#su',
    description: '百度一下按钮',
    type: 'button',
    fallback: [
      'input[type="submit"][id="su"]',
      '.bg.s_btn',
      'input[value="百度一下"]'
    ]
  },
  
  // 搜索建议下拉框（可选）
  suggestions: {
    selector: '.bdsug',
    description: '搜索建议列表',
    type: 'div'
  }
}
```

**操作流程**:
1. 定位搜索输入框：`#kw`
2. 填充搜索关键词
3. 点击搜索按钮：`#su` 或直接按 Enter 键

**示例操作**:
```javascript
const actions = [
  {
    action: 'fill',
    target: { selector: '#kw' },
    params: { value: 'AI 浏览器插件' }
  },
  {
    action: 'click',
    target: { selector: '#su' }
  }
]
```

### 2. Google 搜索

**页面路径**: `https://www.google.com/` 或 `https://www.google.com/search`

**关键元素选择器**:

```javascript
{
  // 搜索输入框
  searchInput: {
    selector: 'textarea[name="q"]',
    description: 'Google 搜索输入框',
    type: 'textarea',
    fallback: [
      'input[name="q"]',
      'textarea[aria-label*="Search"]',
      '.gLFyf'
    ]
  },
  
  // 搜索按钮
  searchButton: {
    selector: 'input[type="submit"][name="btnK"]',
    description: 'Google Search 按钮',
    type: 'button',
    fallback: [
      'input[name="btnK"]',
      'button[aria-label="Google Search"]',
      '.gNO89b'
    ]
  },
  
  // "手气不错"按钮（可选）
  luckyButton: {
    selector: 'input[name="btnI"]',
    description: 'I\'m Feeling Lucky 按钮',
    type: 'button'
  }
}
```

**操作流程**:
1. 定位搜索输入框：`textarea[name="q"]`（注意：Google 使用 textarea）
2. 填充搜索关键词
3. 点击搜索按钮或按 Enter 键

**示例操作**:
```javascript
const actions = [
  {
    action: 'fill',
    target: { selector: 'textarea[name="q"]' },
    params: { value: 'Chrome extension automation' }
  },
  {
    action: 'press',
    target: { selector: 'textarea[name="q"]' },
    params: { key: 'Enter' }
  }
]
```

### 3. Bing 搜索

**页面路径**: `https://www.bing.com/` 或 `https://www.bing.com/search`

**关键元素选择器**:

```javascript
{
  // 搜索输入框
  searchInput: {
    selector: 'input[name="q"]',
    description: 'Bing 搜索输入框',
    type: 'input',
    fallback: [
      '#sb_form_q',
      'input[type="search"]',
      '.b_searchbox'
    ]
  },
  
  // 搜索按钮
  searchButton: {
    selector: '#search_icon',
    description: 'Bing 搜索按钮',
    type: 'button',
    fallback: [
      'button[type="submit"]',
      '.b_searchboxSubmit',
      'input[type="submit"]'
    ]
  }
}
```

**操作流程**:
1. 定位搜索输入框：`input[name="q"]`
2. 填充搜索关键词
3. 点击搜索按钮：`#search_icon`

### 4. 搜狗搜索

**页面路径**: `https://www.sogou.com/`

**关键元素选择器**:

```javascript
{
  // 搜索输入框
  searchInput: {
    selector: '#query',
    description: '搜狗搜索输入框',
    type: 'input',
    fallback: [
      'input[name="query"]',
      '.search-input'
    ]
  },
  
  // 搜索按钮
  searchButton: {
    selector: '#stb',
    description: '搜狗搜索按钮',
    type: 'button',
    fallback: [
      'input[type="submit"]',
      '.search-btn'
    ]
  }
}
```

### 5. Yahoo 搜索

**页面路径**: `https://www.yahoo.com/` 或 `https://search.yahoo.com/`

**关键元素选择器**:

```javascript
{
  // 搜索输入框
  searchInput: {
    selector: 'input[name="p"]',
    description: 'Yahoo 搜索输入框',
    type: 'input',
    fallback: [
      '#yschsp',
      'input[type="text"][name="p"]'
    ]
  },
  
  // 搜索按钮
  searchButton: {
    selector: 'button[type="submit"]',
    description: 'Yahoo 搜索按钮',
    type: 'button',
    fallback: [
      '#search-button',
      'input[type="submit"]'
    ]
  }
}
```

### 6. DuckDuckGo 搜索

**页面路径**: `https://www.duckduckgo.com/` 或 `https://html.duckduckgo.com/`

**关键元素选择器**:

```javascript
{
  // 搜索输入框
  searchInput: {
    selector: 'input[name="q"]',
    description: 'DuckDuckGo 搜索输入框',
    type: 'input',
    fallback: [
      '#search_form_input_homepage',
      'input[type="text"][name="q"]'
    ]
  },
  
  // 搜索按钮
  searchButton: {
    selector: 'input[type="submit"]',
    description: 'DuckDuckGo 搜索按钮',
    type: 'button',
    fallback: [
      '#search_button_homepage',
      'button[type="submit"]'
    ]
  }
}
```

## 使用指南

### 基本使用模式

当需要在搜索引擎上执行搜索时，使用本 skill 提供的选择器信息：

1. **识别搜索引擎**: 根据当前页面 URL 确定是哪个搜索引擎
2. **查找对应选择器**: 从上述列表中找到相关的 DOM 选择器
3. **执行搜索操作**: 使用 `page_action` 工具，直接使用预定义的选择器

### 通用搜索流程

对于所有搜索引擎，基本流程都是：

```javascript
const actions = [
  // 1. 填充搜索关键词
  {
    action: 'fill',
    target: {
      selector: '<搜索引擎特定的选择器>'
    },
    params: {
      value: '搜索关键词'
    }
  },
  // 2. 点击搜索按钮或按 Enter
  {
    action: 'click',
    target: {
      selector: '<搜索按钮选择器>'
    }
  }
  // 或者使用 press 操作按 Enter
  // {
  //   action: 'press',
  //   target: { selector: '<搜索框选择器>' },
  //   params: { key: 'Enter' }
  // }
]
```

### 快速识别搜索引擎

根据 URL 快速识别：

- `baidu.com` → 使用百度选择器（`#kw`, `#su`）
- `google.com` → 使用 Google 选择器（`textarea[name="q"]`）
- `bing.com` → 使用 Bing 选择器（`input[name="q"]`, `#search_icon`）
- `sogou.com` → 使用搜狗选择器（`#query`, `#stb`）
- `yahoo.com` → 使用 Yahoo 选择器（`input[name="p"]`）
- `duckduckgo.com` → 使用 DuckDuckGo 选择器（`input[name="q"]`）

## 注意事项

1. **Google 特殊处理**: Google 使用 `textarea` 而不是 `input`，需要注意
2. **动态加载**: 某些搜索引擎可能动态加载元素，需要等待元素出现
3. **搜索建议**: 输入时可能出现搜索建议下拉框，可以忽略或选择
4. **Enter 键**: 大多数搜索引擎支持在搜索框中按 Enter 键直接搜索，比点击按钮更快
5. **URL 参数**: 搜索结果页面的 URL 可能包含搜索关键词参数

## 最佳实践

1. **优先使用 name 属性**: `name="q"` 等属性选择器最稳定
2. **提供备用选择器**: 为关键元素提供多个备用选择器（fallback）
3. **使用 Enter 键**: 在搜索框中按 Enter 比点击按钮更可靠
4. **等待元素**: 对于动态加载的内容，使用 `wait` 操作等待元素出现
5. **验证操作**: 搜索后可以验证 URL 变化或页面内容变化

## 演示示例

### 示例 1: 在百度搜索

```javascript
// 用户请求: "在百度搜索 AI 技术"
const actions = [
  {
    action: 'fill',
    target: { selector: '#kw' },
    params: { value: 'AI 技术' }
  },
  {
    action: 'click',
    target: { selector: '#su' }
  }
]
```

### 示例 2: 在 Google 搜索

```javascript
// 用户请求: "在 Google 搜索 Chrome extension"
const actions = [
  {
    action: 'fill',
    target: { selector: 'textarea[name="q"]' },
    params: { value: 'Chrome extension' }
  },
  {
    action: 'press',
    target: { selector: 'textarea[name="q"]' },
    params: { key: 'Enter' }
  }
]
```

### 示例 3: 通用搜索（自动识别）

```javascript
// AI 根据当前页面 URL 自动选择对应的选择器
function getSearchSelectors(url) {
  if (url.includes('baidu.com')) {
    return { input: '#kw', button: '#su' }
  } else if (url.includes('google.com')) {
    return { input: 'textarea[name="q"]', button: 'input[name="btnK"]' }
  } else if (url.includes('bing.com')) {
    return { input: 'input[name="q"]', button: '#search_icon' }
  }
  // ... 其他搜索引擎
}
```

## 扩展信息

更多详细的 DOM 结构和操作模式，请参考：
- [references/search-selectors.md](references/search-selectors.md) - 完整的搜索选择器参考
- [references/search-workflows.md](references/search-workflows.md) - 搜索操作流程示例
