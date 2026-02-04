# 页面解读模式参考

本文档提供了各种页面解读的详细模式和最佳实践。

## 目录

- [页面类型识别](#页面类型识别)
- [元素识别策略](#元素识别策略)
- [选择器提取模式](#选择器提取模式)
- [操作流程识别](#操作流程识别)
- [文档生成模板](#文档生成模板)

## 页面类型识别

### 登录页面

**特征识别**:
- URL 通常包含 `/login`、`/signin`、`/auth`
- 页面包含用户名和密码输入框
- 有提交按钮（登录/登录按钮）
- 可能有"记住我"复选框

**解读步骤**:
1. 识别表单容器：`form`、`.login-form`、`#login-form`
2. 识别用户名输入框：`input[name="username"]`、`input[type="text"]`、`#username`
3. 识别密码输入框：`input[type="password"]`、`input[name="password"]`
4. 识别登录按钮：`button[type="submit"]`、`.login-btn`、`button:contains("登录")`
5. 识别其他元素：记住我复选框、忘记密码链接等

**生成的选择器示例**:
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

### 搜索页面

**特征识别**:
- URL 通常包含 `/search`、`/search?q=`
- 页面包含搜索输入框
- 有搜索按钮或自动搜索
- 有搜索结果列表/卡片

**解读步骤**:
1. 识别搜索输入框：`input[name="q"]`、`input[type="search"]`、`#search-input`
2. 识别搜索按钮：`button[type="submit"]`、`.search-btn`、`button[aria-label="搜索"]`
3. 识别搜索结果容器：`.search-results`、`#results`、`.result-list`
4. 识别结果项：`.result-item`、`.search-result`、`article`

**生成的选择器示例**:
```javascript
{
  searchInput: {
    selector: 'input[name="q"]',
    description: '搜索输入框',
    type: 'input',
    fallback: ['#search-input', '.search-box input', 'input[type="search"]']
  },
  searchButton: {
    selector: 'button[type="submit"]',
    description: '搜索按钮',
    type: 'button',
    fallback: ['.search-btn', 'button[aria-label="搜索"]']
  },
  resultsContainer: {
    selector: '.search-results',
    description: '搜索结果容器',
    type: 'container',
    fallback: ['#results', '.result-list']
  }
}
```

### 表单页面

**特征识别**:
- 页面包含多个输入字段
- 有提交按钮
- 可能有验证码、文件上传等特殊元素

**解读步骤**:
1. 识别表单容器：`form`、`.form-container`
2. 识别所有输入字段：`input`、`textarea`、`select`
3. 识别字段标签：`label`、`[aria-label]`、`placeholder`
4. 识别提交按钮：`button[type="submit"]`、`.submit-btn`
5. 识别特殊元素：验证码、文件上传、日期选择器等

**生成的选择器示例**:
```javascript
{
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
  submitButton: {
    selector: 'button[type="submit"]',
    description: '提交按钮',
    type: 'button',
    fallback: ['.submit-btn', 'button:contains("提交")']
  }
}
```

### 列表/表格页面

**特征识别**:
- 页面包含数据列表或表格
- 可能有分页、排序、筛选功能
- 每个项目可能有详情链接

**解读步骤**:
1. 识别数据容器：`table`、`.list-container`、`.data-table`
2. 识别表头/列表项：`thead th`、`.list-item`、`.card`
3. 识别分页元素：`.pagination`、`.page-nav`、`[aria-label*="页"]`
4. 识别排序/筛选元素：`.sort-btn`、`.filter-dropdown`
5. 识别详情链接：`a[href*="/detail"]`、`.detail-link`

**生成的选择器示例**:
```javascript
{
  dataTable: {
    selector: '.data-table',
    description: '数据表格',
    type: 'table',
    fallback: ['table', '#data-table']
  },
  pagination: {
    selector: '.pagination',
    description: '分页容器',
    type: 'container',
    fallback: ['.page-nav', '[aria-label*="页"]']
  },
  nextPageButton: {
    selector: '.pagination .next',
    description: '下一页按钮',
    type: 'button',
    fallback: ['button[aria-label="下一页"]', '.next-page']
  }
}
```

## 元素识别策略

### 输入框识别

**识别模式**:
1. 通过 `name` 属性：`input[name="username"]`
2. 通过 `id` 属性：`#username`
3. 通过 `type` 属性：`input[type="email"]`
4. 通过 `placeholder` 属性：`input[placeholder*="用户名"]`
5. 通过 `aria-label` 属性：`input[aria-label="用户名"]`
6. 通过标签关联：`label[for="username"]` → `#username`

**优先级顺序**:
1. `name` 属性（最稳定）
2. `id` 属性（如果存在且稳定）
3. `aria-label` 属性（语义化）
4. `placeholder` 属性（可能变化）
5. `class` 属性（最不稳定）

### 按钮识别

**识别模式**:
1. 通过 `type` 属性：`button[type="submit"]`
2. 通过文本内容：`button:contains("登录")`
3. 通过 `aria-label` 属性：`button[aria-label="登录"]`
4. 通过 `class` 属性：`.login-btn`
5. 通过 `id` 属性：`#login-button`

**优先级顺序**:
1. `type` 属性（最稳定）
2. `aria-label` 属性（语义化）
3. `id` 属性（如果存在且稳定）
4. 文本内容（可能变化）
5. `class` 属性（最不稳定）

### 链接识别

**识别模式**:
1. 通过 `href` 属性：`a[href="/login"]`
2. 通过文本内容：`a:contains("登录")`
3. 通过 `aria-label` 属性：`a[aria-label="登录"]`
4. 通过 `class` 属性：`.login-link`

**优先级顺序**:
1. `href` 属性（最稳定）
2. `aria-label` 属性（语义化）
3. 文本内容（可能变化）
4. `class` 属性（最不稳定）

### 容器识别

**识别模式**:
1. 通过语义化标签：`main`、`article`、`section`
2. 通过 `role` 属性：`[role="main"]`、`[role="article"]`
3. 通过 `class` 属性：`.content`、`.main-content`
4. 通过 `id` 属性：`#content`、`#main`

**优先级顺序**:
1. 语义化标签（最稳定）
2. `role` 属性（语义化）
3. `id` 属性（如果存在且稳定）
4. `class` 属性（最不稳定）

## 选择器提取模式

### 单一选择器提取

**模式**: 识别单个元素的最佳选择器

**步骤**:
1. 检查元素的所有属性
2. 按优先级选择最稳定的属性
3. 生成选择器字符串
4. 记录备用选择器

**示例**:
```javascript
// 元素: <input name="username" id="username" class="form-input" placeholder="请输入用户名">
{
  selector: 'input[name="username"]',  // 优先使用 name
  fallback: ['#username', 'input[placeholder*="用户名"]']  // 备用选择器
}
```

### 组合选择器提取

**模式**: 当单一属性不够精确时，组合多个属性

**步骤**:
1. 识别多个稳定属性
2. 组合成更精确的选择器
3. 提供简化版本作为备用

**示例**:
```javascript
// 元素: <button type="submit" class="btn btn-primary" aria-label="登录">
{
  selector: 'button[type="submit"][aria-label="登录"]',  // 组合选择器
  fallback: ['button[type="submit"]', 'button[aria-label="登录"]']  // 单一属性备用
}
```

### 上下文选择器提取

**模式**: 当元素本身属性不稳定时，使用父元素或兄弟元素作为上下文

**步骤**:
1. 识别稳定的父元素
2. 使用后代选择器或子选择器
3. 提供直接选择器作为备用

**示例**:
```javascript
// 结构: <form class="login-form"><input name="username"></form>
{
  selector: '.login-form input[name="username"]',  // 上下文选择器
  fallback: ['input[name="username"]']  // 直接选择器备用
}
```

## 操作流程识别

### 线性流程识别

**模式**: 识别顺序执行的操作步骤

**步骤**:
1. 识别操作的起点（如输入框）
2. 识别操作的终点（如提交按钮）
3. 识别中间步骤（如验证、确认）
4. 生成步骤序列

**示例**:
```markdown
**操作流程**:
1. 定位用户名输入框：`input[name="username"]`
2. 填充用户名
3. 定位密码输入框：`input[name="password"]`
4. 填充密码
5. 点击登录按钮：`button[type="submit"]`
```

### 条件流程识别

**模式**: 识别包含条件分支的操作流程

**步骤**:
1. 识别条件判断点（如复选框、单选按钮）
2. 识别不同分支的操作
3. 生成条件流程说明

**示例**:
```markdown
**操作流程**:
1. 定位用户名输入框：`input[name="username"]`
2. 填充用户名
3. 定位密码输入框：`input[name="password"]`
4. 填充密码
5. （可选）勾选记住我：`input[type="checkbox"][name="remember"]`
6. 点击登录按钮：`button[type="submit"]`
```

### 循环流程识别

**模式**: 识别需要重复执行的操作（如分页、加载更多）

**步骤**:
1. 识别循环的起点和终点
2. 识别循环条件（如是否有下一页）
3. 生成循环流程说明

**示例**:
```markdown
**操作流程**:
1. 提取当前页数据：`extract_data({ dataType: 'table' })`
2. 检查是否有下一页：`.pagination .next:not(.disabled)`
3. 如果有下一页，点击下一页按钮：`.pagination .next`
4. 等待页面加载：`wait({ timeout: 2000 })`
5. 重复步骤1-4，直到没有下一页
```

## 文档生成模板

### 完整文档模板

```markdown
---
name: website-name
description: 网站描述和适用场景。适用于需要在该网站执行特定操作的场景。
---

# 网站名称 Skill

本 skill 提供了特定网站常见操作的 DOM 选择器信息，帮助 AI 更精准地操作页面元素。

## 适用页面

- `https://example.com/**` - 网站的所有页面
- `https://*.example.com/**` - 子域名页面（如适用）

## 核心操作和 DOM 选择器

### 1. 操作名称

**页面路径**: `/path/to/page`

**关键元素选择器**:

\`\`\`javascript
{
  elementName: {
    selector: 'selector',
    description: '元素描述',
    type: 'input|button|link|container|...',
    fallback: ['备用选择器1', '备用选择器2']
  }
}
\`\`\`

**操作流程**:
1. 步骤1描述
2. 步骤2描述
...

## 使用指南

### 基本使用模式

当需要在目标网站上执行操作时，使用本 skill 提供的选择器信息：

1. **识别操作类型**: 确定要执行的操作
2. **查找对应选择器**: 从上述列表中找到相关的 DOM 选择器
3. **执行操作**: 使用 `page_action` 工具，直接使用预定义的选择器

### 注意事项

1. **动态内容**: 某些元素可能是动态加载的，需要等待元素出现
2. **iframe 处理**: 某些表单可能在 iframe 中，需要先切换到对应的 frame
3. **URL 匹配**: 确保当前页面 URL 匹配操作所需的页面路径
```

### 简化文档模板

对于简单的单页面操作：

```markdown
---
name: simple-operation
description: 简单操作描述
---

# 操作名称

## 适用页面

- `https://example.com/page`

## 操作步骤

1. 定位元素：`selector`
2. 执行操作：描述操作
3. 验证结果：描述验证方式

## 关键选择器

\`\`\`javascript
{
  keyElement: {
    selector: 'selector',
    description: '描述',
    type: 'type'
  }
}
\`\`\`
```

## 最佳实践

### 1. 选择器稳定性

- ✅ 优先使用 `name`、`id`、`aria-label` 等稳定属性
- ✅ 提供多个备用选择器
- ❌ 避免使用可能变化的 `class` 名称
- ❌ 避免使用位置选择器（如 `:nth-child(2)`）

### 2. 文档完整性

- ✅ 包含所有必要的操作步骤
- ✅ 说明等待条件和错误处理
- ✅ 提供使用示例
- ❌ 避免遗漏关键步骤
- ❌ 避免使用模糊的描述

### 3. 可维护性

- ✅ 使用清晰的结构和命名
- ✅ 添加必要的注释
- ✅ 保持文档格式一致
- ❌ 避免过度复杂的嵌套结构
