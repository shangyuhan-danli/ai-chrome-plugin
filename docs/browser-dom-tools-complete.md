# 浏览器插件 DOM 工具完整定义

> 基于业界标准（Playwright、Selenium、Cypress）设计的完整 DOM 操作工具集
> 更新时间: 2026-02-03

## 工具概览

| 工具名称 | 说明 | 操作数 |
|---------|------|--------|
| `page_action` | 执行页面 DOM 操作（核心工具） | 32 种 |
| `request_more_elements` | 请求更多页面元素 | - |
| `get_selected_text` | 获取用户选中文字 | - |
| `clear_ai_styles` | 清除 AI 添加的样式 | - |

---

## 核心工具：page_action

### 工具描述
在用户当前浏览的网页上执行各种 DOM 操作，支持批量执行多个操作。

### 参数 Schema

```json
{
  "name": "page_action",
  "description": "在用户当前浏览的网页上执行操作，支持32种操作类型",
  "parameters": {
    "type": "object",
    "properties": {
      "actions": {
        "type": "array",
        "description": "要执行的操作列表",
        "items": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "enum": [
                "fill", "click", "highlight", "underline", "select", "check", "scroll", "read",
                "hover", "type", "press", "drag", "wait", "focus", "blur", "clear",
                "getAttribute", "getProperty", "navigate", "scrollIntoView", "switchFrame",
                "handleDialog", "setLocalStorage", "getLocalStorage", "clearLocalStorage",
                "setCookie", "getCookie", "clearCookies"
              ]
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
                "direction": { "type": "string", "enum": ["up", "down", "top", "bottom"] },
                "delay": { "type": "number" },
                "key": { "type": "string" },
                "destination": { "type": "object" },
                "timeout": { "type": "number" },
                "condition": { "type": "string", "enum": ["visible", "hidden", "exists"] },
                "behavior": { "type": "string", "enum": ["auto", "smooth"] },
                "block": { "type": "string", "enum": ["start", "center", "end", "nearest"] },
                "attribute": { "type": "string" },
                "property": { "type": "string" },
                "navigateAction": { "type": "string", "enum": ["goto", "back", "forward", "reload"] },
                "url": { "type": "string" },
                "frameSelector": { "type": "string" },
                "dialogAction": { "type": "string", "enum": ["accept", "dismiss"] },
                "promptText": { "type": "string" },
                "prefix": { "type": "string" },
                "name": { "type": "string" },
                "cookieOptions": { "type": "object" }
              }
            }
          },
          "required": ["action", "target"]
        }
      }
    },
    "required": ["actions"]
  }
}
```

---

## 操作类型详细说明

### 一、元素交互类（8种）

#### 1. `fill` - 填充输入框
一次性填充整个值，触发 input/change 事件。

```json
{
  "action": "fill",
  "target": { "elementId": "e_xxx" },
  "params": { "value": "要填写的内容" }
}
```

**支持的元素**: `input`, `textarea`, `[contenteditable]`

#### 2. `type` - 逐字符输入（模拟真实打字）
逐个字符输入，可设置延迟，模拟人类打字效果。

```json
{
  "action": "type",
  "target": { "elementId": "e_xxx" },
  "params": { 
    "value": "Hello World",
    "delay": 50  // 每个字符间隔50ms
  }
}
```

#### 3. `click` - 点击元素
点击按钮、链接或其他可点击元素。

```json
{
  "action": "click",
  "target": { "elementId": "e_xxx" }
}
```

#### 4. `hover` - 鼠标悬停
触发 mouseover 事件，常用于显示下拉菜单等。

```json
{
  "action": "hover",
  "target": { "elementId": "e_xxx" }
}
```

#### 5. `focus` - 聚焦元素
将焦点设置到指定元素。

```json
{
  "action": "focus",
  "target": { "elementId": "e_xxx" }
}
```

#### 6. `blur` - 失焦元素
使元素失去焦点。

```json
{
  "action": "blur",
  "target": { "elementId": "e_xxx" }
}
```

#### 7. `clear` - 清空输入框
清空输入框内容，触发 input/change 事件。

```json
{
  "action": "clear",
  "target": { "elementId": "e_xxx" }
}
```

#### 8. `press` - 按键操作
模拟键盘按键（Enter, Tab, Escape, Control+a 等）。

```json
{
  "action": "press",
  "params": { "key": "Enter" }
}
```

**常用按键**: `Enter`, `Tab`, `Escape`, `Backspace`, `ArrowUp`, `ArrowDown`, `Control+a`, `Control+c`, `Control+v`

---

### 二、表单操作类（3种）

#### 9. `select` - 选择下拉选项
选择 `<select>` 元素的选项，支持按 value 或文本匹配。

```json
{
  "action": "select",
  "target": { "elementId": "e_xxx" },
  "params": { "value": "option_value" }
}
```

**匹配规则**:
1. 优先匹配 option 的 value 属性
2. 其次匹配 option 的 text 内容（不区分大小写）

#### 10. `check` - 勾选/取消勾选
切换复选框的选中状态。

```json
{
  "action": "check",
  "target": { "elementId": "e_xxx" }
}
```

#### 11. `drag` - 拖拽元素
将元素拖拽到另一个元素或指定坐标位置。

```json
// 拖拽到另一个元素
{
  "action": "drag",
  "target": { "elementId": "e_source" },
  "params": { 
    "destination": { "selector": "#drop-zone" }
  }
}

// 拖拽到坐标
{
  "action": "drag",
  "target": { "elementId": "e_source" },
  "params": { 
    "destination": { "x": 100, "y": 200 }
  }
}
```

---

### 三、页面控制类（4种）

#### 12. `scroll` - 滚动页面
按方向滚动页面。

```json
{
  "action": "scroll",
  "params": { "direction": "down" }  // up, down, top, bottom
}
```

#### 13. `scrollIntoView` - 滚动到元素可见
滚动页面使指定元素进入视口。

```json
{
  "action": "scrollIntoView",
  "target": { "elementId": "e_xxx" },
  "params": { 
    "behavior": "smooth",  // auto, smooth
    "block": "center"      // start, center, end, nearest
  }
}
```

#### 14. `navigate` - 页面导航
控制浏览器导航。

```json
// 跳转到指定URL
{
  "action": "navigate",
  "params": { 
    "navigateAction": "goto",
    "url": "https://example.com"
  }
}

// 前进/后退/刷新
{
  "action": "navigate",
  "params": { "navigateAction": "back" }      // back, forward, reload
}
```

#### 15. `switchFrame` - 切换 iframe
切换到 iframe 上下文或切回主文档。

```json
// 切换到 iframe
{
  "action": "switchFrame",
  "params": { "frameSelector": "iframe#content" }
}

// 切回主文档
{
  "action": "switchFrame",
  "params": {}
}
```

**注意**: 跨域 iframe 受同源策略限制，可能无法访问。

---

### 四、信息获取类（4种）

#### 16. `read` - 读取元素内容
获取元素的文本内容。

```json
{
  "action": "read",
  "target": { "elementId": "e_xxx" }
}
```

**返回**: `{ success: true, message: "已读取内容", data: "文本内容" }`

#### 17. `getAttribute` - 获取元素属性
获取元素的 HTML 属性值。

```json
{
  "action": "getAttribute",
  "target": { "elementId": "e_xxx" },
  "params": { "attribute": "href" }
}
```

**返回**: `{ success: true, data: "https://example.com" }`

#### 18. `getProperty` - 获取元素属性值
获取元素的 DOM 属性值（如 `checked`, `value`, `disabled` 等）。

```json
{
  "action": "getProperty",
  "target": { "elementId": "e_xxx" },
  "params": { "property": "checked" }
}
```

#### 19. `wait` - 等待元素或时间
等待条件满足或固定时间。

```json
// 等待元素出现
{
  "action": "wait",
  "target": { "elementId": "e_xxx" },
  "params": { 
    "timeout": 5000,
    "condition": "visible"  // visible, hidden, exists
  }
}

// 简单等待
{
  "action": "wait",
  "params": { "timeout": 1000 }
}
```

---

### 五、样式与标记类（2种）

#### 20. `highlight` - 高亮文字/元素
为元素或选中的文字添加背景色高亮。

```json
{
  "action": "highlight",
  "target": { "elementId": "e_xxx" },
  "params": { "color": "#ffeb3b" }  // 默认黄色
}
```

#### 21. `underline` - 添加下划线
为元素或选中的文字添加下划线。

```json
{
  "action": "underline",
  "target": { "elementId": "e_xxx" }
}
```

---

### 六、弹窗处理类（1种）

#### 22. `handleDialog` - 处理弹窗
处理 `alert`, `confirm`, `prompt` 弹窗。

```json
// 确认弹窗
{
  "action": "handleDialog",
  "params": { "dialogAction": "accept" }
}

// 取消弹窗
{
  "action": "handleDialog",
  "params": { "dialogAction": "dismiss" }
}

// prompt 输入值
{
  "action": "handleDialog",
  "params": { 
    "dialogAction": "accept",
    "promptText": "输入的内容"
  }
}
```

---

### 七、本地存储类（3种）

#### 23. `setLocalStorage` - 设置 localStorage
存储数据到 localStorage。

```json
{
  "action": "setLocalStorage",
  "params": { 
    "key": "user_token",
    "value": "abc123"
  }
}
```

#### 24. `getLocalStorage` - 获取 localStorage
从 localStorage 读取数据。

```json
{
  "action": "getLocalStorage",
  "params": { "key": "user_token" }
}
```

**返回**: `{ success: true, data: "abc123" }`

#### 25. `clearLocalStorage` - 清除 localStorage
清除所有或指定前缀的 localStorage 项。

```json
// 清除所有
{
  "action": "clearLocalStorage",
  "params": {}
}

// 清除指定前缀
{
  "action": "clearLocalStorage",
  "params": { "prefix": "app_" }
}
```

---

### 八、Cookie 管理类（3种）

#### 26. `setCookie` - 设置 Cookie
设置浏览器 Cookie。

```json
{
  "action": "setCookie",
  "params": { 
    "name": "session_id",
    "value": "xyz789",
    "cookieOptions": {
      "expires": 3600,    // 1小时后过期（秒）
      "path": "/",
      "secure": true
    }
  }
}
```

#### 27. `getCookie` - 获取 Cookie
获取指定或所有 Cookie。

```json
// 获取指定 Cookie
{
  "action": "getCookie",
  "params": { "name": "session_id" }
}

// 获取所有 Cookies
{
  "action": "getCookie",
  "params": {}
}
```

#### 28. `clearCookies` - 清除 Cookie
清除指定或所有 Cookie。

```json
// 清除指定 Cookie
{
  "action": "clearCookies",
  "params": { "name": "session_id" }
}

// 清除所有 Cookies
{
  "action": "clearCookies",
  "params": {}
}
```

---

## 其他工具定义

### request_more_elements
当当前页面元素不足以完成任务时，请求更多特定区域或类型的元素。

```json
{
  "name": "request_more_elements",
  "description": "请求特定区域或类型的更多页面元素",
  "parameters": {
    "type": "object",
    "properties": {
      "region": {
        "type": "string",
        "enum": ["form", "header", "sidebar", "footer", "below_viewport"]
      },
      "elementType": {
        "type": "string",
        "enum": ["input", "button", "link", "select", "all"]
      },
      "keyword": {
        "type": "string"
      }
    }
  }
}
```

### get_selected_text
获取用户在页面上选中的文字。

```json
{
  "name": "get_selected_text",
  "description": "获取用户选中的文字内容",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

### clear_ai_styles
清除 AI 在页面上添加的所有高亮和下划线样式。

```json
{
  "name": "clear_ai_styles",
  "description": "清除所有 AI 添加的样式，恢复页面原始状态",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

---

## 使用示例

### 示例 1: 自动登录

```json
{
  "tool_call": {
    "tool_name": "page_action",
    "arguments": "{\"actions\":[{\"action\":\"fill\",\"target\":{\"elementId\":\"e_username\"},\"params\":{\"value\":\"user@example.com\"}},{\"action\":\"fill\",\"target\":{\"elementId\":\"e_password\"},\"params\":{\"value\":\"mypassword\"}},{\"action\":\"click\",\"target\":{\"elementId\":\"e_login_btn\"}}]}"
  }
}
```

### 示例 2: 复杂表单填写

```json
{
  "tool_call": {
    "tool_name": "page_action",
    "arguments": "{\"actions\":[{\"action\":\"fill\",\"target\":{\"elementId\":\"e_name\"},\"params\":{\"value\":\"张三\"}},{\"action\":\"select\",\"target\":{\"elementId\":\"e_gender\"},\"params\":{\"value\":\"male\"}},{\"action\":\"check\",\"target\":{\"elementId\":\"e_agree\"}},{\"action\":\"type\",\"target\":{\"elementId\":\"e_bio\"},\"params\":{\"value\":\"这是个人简介...\",\"delay\":30}},{\"action\":\"click\",\"target\":{\"elementId\":\"e_submit\"}}]}"
  }
}
```

### 示例 3: 搜索操作

```json
{
  "tool_call": {
    "tool_name": "page_action",
    "arguments": "{\"actions\":[{\"action\":\"clear\",\"target\":{\"elementId\":\"e_search\"}},{\"action\":\"type\",\"target\":{\"elementId\":\"e_search\"},\"params\":{\"value\":\"iPhone 16 Pro\",\"delay\":50}},{\"action\":\"press\",\"params\":{\"key\":\"Enter\"}}]}"
  }
}
```

### 示例 4: 页面导航 + 滚动

```json
{
  "tool_call": {
    "tool_name": "page_action",
    "arguments": "{\"actions\":[{\"action\":\"navigate\",\"params\":{\"navigateAction\":\"goto\",\"url\":\"https://example.com/products\"}},{\"action\":\"wait\",\"params\":{\"timeout\":2000}},{\"action\":\"scrollIntoView\",\"target\":{\"elementId\":\"e_footer\"},\"params\":{\"behavior\":\"smooth\",\"block\":\"end\"}}]}"
  }
}
```

### 示例 5: 信息提取

```json
{
  "tool_call": {
    "tool_name": "page_action",
    "arguments": "{\"actions\":[{\"action\":\"read\",\"target\":{\"elementId\":\"e_price\"}},{\"action\":\"getAttribute\",\"target\":{\"elementId\":\"e_link\"},\"params\":{\"attribute\":\"href\"}},{\"action\":\"getProperty\",\"target\":{\"elementId\":\"e_checkbox\"},\"params\":{\"property\":\"checked\"}}]}"
  }
}
```

---

## 操作类型速查表

| 操作 | 用途 | 主要参数 |
|------|------|----------|
| **元素交互** |||
| `fill` | 快速填充 | `value` |
| `type` | 逐字输入 | `value`, `delay` |
| `click` | 点击 | - |
| `hover` | 悬停 | - |
| `focus` | 聚焦 | - |
| `blur` | 失焦 | - |
| `clear` | 清空 | - |
| `press` | 按键 | `key` |
| **表单操作** |||
| `select` | 下拉选择 | `value` |
| `check` | 勾选 | - |
| `drag` | 拖拽 | `destination` |
| **页面控制** |||
| `scroll` | 页面滚动 | `direction` |
| `scrollIntoView` | 滚动到元素 | `behavior`, `block` |
| `navigate` | 导航 | `navigateAction`, `url` |
| `switchFrame` | 切换 iframe | `frameSelector` |
| **信息获取** |||
| `read` | 读取内容 | - |
| `getAttribute` | 获取属性 | `attribute` |
| `getProperty` | 获取属性值 | `property` |
| `wait` | 等待 | `timeout`, `condition` |
| **样式标记** |||
| `highlight` | 高亮 | `color` |
| `underline` | 下划线 | - |
| **弹窗处理** |||
| `handleDialog` | 处理弹窗 | `dialogAction`, `promptText` |
| **本地存储** |||
| `setLocalStorage` | 设置存储 | `key`, `value` |
| `getLocalStorage` | 获取存储 | `key` |
| `clearLocalStorage` | 清除存储 | `prefix` |
| **Cookie管理** |||
| `setCookie` | 设置 Cookie | `name`, `value`, `cookieOptions` |
| `getCookie` | 获取 Cookie | `name` |
| `clearCookies` | 清除 Cookie | `name` |

---

## 设计原则

1. **参考业界标准**: 基于 Playwright、Selenium、Cypress 的 API 设计
2. **支持批量操作**: 一次调用可执行多个操作，按顺序执行
3. **双定位策略**: 优先使用 elementId，其次使用 CSS selector
4. **事件完整性**: 触发完整的 DOM 事件序列（focus → input → change）
5. **人类化模拟**: type 操作支持延迟，模拟真实打字
6. **容错设计**: 元素不存在时提供清晰的错误信息
7. **安全性**: 密码框等特殊元素自动屏蔽 value 传递

---

## 后续扩展建议

未来可考虑添加的工具：

- `screenshot` - 页面截图
- `evaluate` - 执行自定义 JavaScript
- `upload` - 文件上传
- `download` - 文件下载
- `setViewport` - 设置视口大小（模拟移动设备）
- `interceptRequest` - 拦截/修改网络请求

---

## 相关文件

- `src/utils/pageActionTypes.ts` - 类型定义
- `src/content/actionExecutor.ts` - 操作执行实现
- `src/utils/browserToolService.ts` - 工具注册
- `docs/browser-tools-backend-guide.md` - 后端集成指南