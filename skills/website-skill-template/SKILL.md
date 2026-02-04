---
name: website-skill-template
description: 为特定网站提供预定义的 DOM 选择器和操作流程，提高 AI 操作页面的准确性。适用于需要精确元素定位的网站自动化操作，如表单填充、数据提取、页面导航等。当用户在目标网站上执行操作时，使用本 skill 提供的选择器信息。
---

# 网站操作 Skill 模板

本 skill 提供了特定网站常见操作的 DOM 选择器信息，帮助 AI 更精准地操作页面元素，避免每次都需要搜索和描述元素，从而节约 token 并提高准确性。

## 适用页面

- `https://example.com/**` - 网站的所有页面
- `https://*.example.com/**` - 子域名页面（如适用）

## 核心操作和 DOM 选择器

### 1. 搜索功能

**页面路径**: `/search` 或首页

**关键元素选择器**:

```javascript
{
  // 搜索输入框
  searchInput: {
    selector: 'input[name="q"]',
    // 或者使用 ID: '#search-input'
    // 或者使用 class: '.search-box input'
    description: '搜索输入框',
    type: 'input',
    fallback: ['#search-input', '.search-box input', 'input[type="search"]']
  },
  
  // 搜索按钮
  searchButton: {
    selector: 'button[type="submit"]',
    // 或者更具体: 'button.search-btn'
    description: '搜索按钮',
    type: 'button',
    fallback: ['.search-btn', 'button[aria-label="搜索"]']
  }
}
```

**操作流程**:
1. 定位搜索输入框：`input[name="q"]`
2. 填充搜索关键词
3. 点击搜索按钮：`button[type="submit"]`

### 2. 登录表单

**页面路径**: `/login`

**关键元素选择器**:

```javascript
{
  // 用户名输入框
  usernameInput: {
    selector: 'input[name="username"]',
    description: '用户名输入框',
    type: 'input',
    fallback: ['#username', 'input[type="text"][placeholder*="用户名"]']
  },
  
  // 密码输入框
  passwordInput: {
    selector: 'input[name="password"]',
    description: '密码输入框',
    type: 'input',
    fallback: ['#password', 'input[type="password"]']
  },
  
  // 登录按钮
  loginButton: {
    selector: 'button[type="submit"]',
    description: '登录按钮',
    type: 'button',
    fallback: ['.login-btn', 'button:contains("登录")']
  },
  
  // 记住我复选框
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
5. （可选）勾选记住我
6. 点击登录按钮：`button[type="submit"]`

### 3. 表单提交

**页面路径**: `/form` 或动态表单页面

**关键元素选择器**:

```javascript
{
  // 表单字段（示例）
  formFields: {
    nameInput: {
      selector: 'input[name="name"]',
      description: '姓名输入框',
      type: 'input'
    },
    emailInput: {
      selector: 'input[name="email"]',
      description: '邮箱输入框',
      type: 'input'
    },
    messageTextarea: {
      selector: 'textarea[name="message"]',
      description: '留言输入框',
      type: 'textarea'
    }
  },
  
  // 提交按钮
  submitButton: {
    selector: 'button[type="submit"]',
    description: '提交按钮',
    type: 'button',
    fallback: ['.submit-btn', 'button:contains("提交")']
  }
}
```

## 使用指南

### 基本使用模式

当需要在目标网站上执行操作时，使用本 skill 提供的选择器信息：

1. **识别操作类型**: 确定要执行的操作（搜索、登录、表单提交等）
2. **查找对应选择器**: 从上述列表中找到相关的 DOM 选择器
3. **执行操作**: 使用 `page_action` 工具，直接使用预定义的选择器

### 示例：搜索操作

```javascript
// 使用预定义的选择器执行搜索
const actions = [
  {
    action: 'fill',
    target: {
      selector: 'input[name="q"]'
    },
    params: {
      value: '搜索关键词'
    }
  },
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  }
]
```

### 选择器优先级策略

1. **优先使用**: `name` 属性选择器（最稳定）
2. **其次使用**: `id` 选择器（如果存在且稳定）
3. **再次使用**: `aria-label` 属性（语义化，较稳定）
4. **最后使用**: `class` 选择器（可能变化，需要谨慎）

### 注意事项

1. **动态内容**: 某些网站使用 React/Vue 等框架，元素可能是动态加载的，需要等待元素出现
2. **iframe 处理**: 某些表单可能在 iframe 中，需要先切换到对应的 frame
3. **验证码**: 某些操作可能需要处理验证码，需要特殊处理
4. **URL 匹配**: 确保当前页面 URL 匹配操作所需的页面路径
5. **元素等待**: 对于动态加载的内容，使用 `wait` 操作等待元素出现

## 扩展信息

更多详细的 DOM 结构和操作模式，请参考：
- [references/dom-selectors.md](references/dom-selectors.md) - 完整的 DOM 选择器参考
- [references/workflows.md](references/workflows.md) - 常见工作流程示例

## 最佳实践

1. **优先使用属性选择器**: `name`、`type`、`aria-label` 等属性选择器比 class 选择器更稳定
2. **组合选择器**: 当单个选择器不够精确时，可以组合多个属性
3. **等待元素**: 对于动态加载的内容，使用 `wait` 操作等待元素出现
4. **验证操作**: 操作后验证结果，确保操作成功
5. **提供备用选择器**: 为关键元素提供多个备用选择器（fallback），提高容错性
