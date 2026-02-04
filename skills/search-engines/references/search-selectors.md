# 搜索引擎 DOM 选择器完整参考

本文档提供了所有主流搜索引擎的详细 DOM 选择器信息。

## 目录

- [百度搜索](#百度搜索)
- [Google 搜索](#google-搜索)
- [Bing 搜索](#bing-搜索)
- [搜狗搜索](#搜狗搜索)
- [Yahoo 搜索](#yahoo-搜索)
- [DuckDuckGo 搜索](#duckduckgo-搜索)
- [其他搜索引擎](#其他搜索引擎)

## 百度搜索

### 首页搜索

**URL**: `https://www.baidu.com/`

| 元素 | 主选择器 | 备用选择器 | 说明 |
|------|---------|-----------|------|
| 搜索输入框 | `#kw` | `input[name="wd"]`, `.s_ipt` | 主搜索框 |
| 搜索按钮 | `#su` | `input[type="submit"][id="su"]`, `.bg.s_btn` | "百度一下"按钮 |
| 搜索建议 | `.bdsug` | `.bdsug-new` | 搜索建议下拉框 |
| 搜索建议项 | `.bdsug-item` | `.bdsug-item a` | 单个建议项 |

### 搜索结果页

**URL**: `https://www.baidu.com/s?wd=关键词`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索结果列表 | `#content_left` | 搜索结果容器 |
| 搜索结果项 | `.result` | 单个搜索结果 |
| 下一页按钮 | `a.n` | 下一页链接 |
| 相关搜索 | `.rs` | 相关搜索建议 |

### 高级搜索

**URL**: `https://www.baidu.com/gaoji/advanced.html`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 包含全部关键词 | `input[name="q1"]` | 全部关键词输入框 |
| 包含完整关键词 | `input[name="q2"]` | 完整关键词输入框 |
| 包含任意关键词 | `input[name="q3"]` | 任意关键词输入框 |
| 不包含关键词 | `input[name="q4"]` | 排除关键词输入框 |

## Google 搜索

### 首页搜索

**URL**: `https://www.google.com/`

| 元素 | 主选择器 | 备用选择器 | 说明 |
|------|---------|-----------|------|
| 搜索输入框 | `textarea[name="q"]` | `input[name="q"]`, `.gLFyf` | 主搜索框（注意是 textarea） |
| 搜索按钮 | `input[type="submit"][name="btnK"]` | `input[name="btnK"]`, `.gNO89b` | "Google Search"按钮 |
| 手气不错 | `input[name="btnI"]` | `input[type="submit"][name="btnI"]` | "I'm Feeling Lucky"按钮 |
| 搜索建议 | `.UUbT9` | `.sbl1` | 搜索建议下拉框 |

### 搜索结果页

**URL**: `https://www.google.com/search?q=关键词`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索结果列表 | `#search` | 搜索结果容器 |
| 搜索结果项 | `.g` | 单个搜索结果 |
| 下一页按钮 | `a#pnnext` | 下一页链接 |
| 相关搜索 | `.brs_col` | 相关搜索建议 |

### 高级搜索

**URL**: `https://www.google.com/advanced_search`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 全部关键词 | `input[name="as_q"]` | 全部关键词 |
| 精确匹配 | `input[name="as_epq"]` | 精确匹配短语 |
| 任意关键词 | `input[name="as_oq"]` | 任意关键词 |
| 排除关键词 | `input[name="as_eq"]` | 排除关键词 |

## Bing 搜索

### 首页搜索

**URL**: `https://www.bing.com/`

| 元素 | 主选择器 | 备用选择器 | 说明 |
|------|---------|-----------|------|
| 搜索输入框 | `input[name="q"]` | `#sb_form_q`, `.b_searchbox` | 主搜索框 |
| 搜索按钮 | `#search_icon` | `button[type="submit"]`, `.b_searchboxSubmit` | 搜索按钮 |
| 搜索建议 | `.sa_tm` | `.sa_as` | 搜索建议下拉框 |

### 搜索结果页

**URL**: `https://www.bing.com/search?q=关键词`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索结果列表 | `#b_results` | 搜索结果容器 |
| 搜索结果项 | `.b_algo` | 单个搜索结果 |
| 下一页按钮 | `a.sb_pagN` | 下一页链接 |

## 搜狗搜索

### 首页搜索

**URL**: `https://www.sogou.com/`

| 元素 | 主选择器 | 备用选择器 | 说明 |
|------|---------|-----------|------|
| 搜索输入框 | `#query` | `input[name="query"]`, `.search-input` | 主搜索框 |
| 搜索按钮 | `#stb` | `input[type="submit"]`, `.search-btn` | 搜索按钮 |
| 搜索建议 | `.sug` | `.sug-item` | 搜索建议下拉框 |

### 搜索结果页

**URL**: `https://www.sogou.com/web?query=关键词`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索结果列表 | `#main` | 搜索结果容器 |
| 搜索结果项 | `.vrwrap` | 单个搜索结果 |
| 下一页按钮 | `a#sogou_next` | 下一页链接 |

## Yahoo 搜索

### 首页搜索

**URL**: `https://www.yahoo.com/` 或 `https://search.yahoo.com/`

| 元素 | 主选择器 | 备用选择器 | 说明 |
|------|---------|-----------|------|
| 搜索输入框 | `input[name="p"]` | `#yschsp`, `input[type="text"][name="p"]` | 主搜索框 |
| 搜索按钮 | `button[type="submit"]` | `#search-button`, `input[type="submit"]` | 搜索按钮 |

### 搜索结果页

**URL**: `https://search.yahoo.com/search?p=关键词`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索结果列表 | `#web` | 搜索结果容器 |
| 搜索结果项 | `.dd.algo` | 单个搜索结果 |
| 下一页按钮 | `a.next` | 下一页链接 |

## DuckDuckGo 搜索

### 首页搜索

**URL**: `https://www.duckduckgo.com/` 或 `https://html.duckduckgo.com/`

| 元素 | 主选择器 | 备用选择器 | 说明 |
|------|---------|-----------|------|
| 搜索输入框 | `input[name="q"]` | `#search_form_input_homepage`, `input[type="text"][name="q"]` | 主搜索框 |
| 搜索按钮 | `input[type="submit"]` | `#search_button_homepage`, `button[type="submit"]` | 搜索按钮 |

### 搜索结果页

**URL**: `https://html.duckduckgo.com/html/?q=关键词`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索结果列表 | `#links` | 搜索结果容器 |
| 搜索结果项 | `.result` | 单个搜索结果 |
| 下一页按钮 | `a.result--more__btn` | 下一页链接 |

## 其他搜索引擎

### 360 搜索

**URL**: `https://www.so.com/`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索输入框 | `#input` | 主搜索框 |
| 搜索按钮 | `#search-button` | 搜索按钮 |

### 神马搜索

**URL**: `https://m.sm.cn/`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索输入框 | `#q` | 主搜索框 |
| 搜索按钮 | `#stb` | 搜索按钮 |

## 选择器优先级建议

1. **优先使用**: `id` 选择器（最稳定，如 `#kw`, `#su`）
2. **其次使用**: `name` 属性选择器（如 `name="q"`, `name="wd"`）
3. **再次使用**: `type` + `name` 组合（如 `input[name="q"]`）
4. **最后使用**: `class` 选择器（可能变化，需要谨慎）

## 常见问题

### Google 使用 textarea 而不是 input

Google 的搜索框是 `textarea` 而不是 `input`，这是需要注意的特殊情况：

```javascript
// ✅ 正确
textarea[name="q"]

// ❌ 错误（在 Google 上无效）
input[name="q"]
```

### 搜索建议下拉框

大多数搜索引擎在输入时会显示搜索建议：

1. 可以忽略建议，直接点击搜索按钮
2. 也可以点击建议项直接搜索
3. 建议框的选择器通常以 `.sug`, `.bdsug`, `.sa_` 等开头

### 动态加载内容

某些搜索引擎可能动态加载元素：

1. 使用 `wait` 操作等待元素出现
2. 设置合理的超时时间（通常 2-3 秒足够）
3. 检查元素是否可见

### Enter 键 vs 点击按钮

大多数搜索引擎支持两种方式：

1. **按 Enter 键**: 更快，更可靠
2. **点击按钮**: 更直观，但可能受按钮状态影响

推荐使用 Enter 键：

```javascript
{
  action: 'press',
  target: { selector: '#kw' },
  params: { key: 'Enter' }
}
```

## 测试选择器

在浏览器控制台中测试选择器：

```javascript
// 百度
document.querySelector('#kw')
document.querySelector('#su')

// Google
document.querySelector('textarea[name="q"]')
document.querySelector('input[name="btnK"]')

// Bing
document.querySelector('input[name="q"]')
document.querySelector('#search_icon')
```
