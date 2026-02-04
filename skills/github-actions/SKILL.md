---
name: github-actions
description: 在 GitHub 网站上执行常见操作，包括创建 issue、提交 PR、浏览仓库等。包含预定义的 DOM 选择器信息，让 AI 能够精准定位页面元素，提高操作准确性和效率。适用于所有 GitHub.com 页面。
---

# GitHub 操作 Skill

本 skill 提供了 GitHub 网站常见操作的 DOM 选择器信息，帮助 AI 更精准地操作页面元素，避免每次都需要搜索和描述元素，从而节约 token 并提高准确性。

## 适用页面

- `https://github.com/**` - 所有 GitHub 页面
- `https://*.github.com/**` - GitHub 企业版页面

## 核心操作和 DOM 选择器

### 1. 创建 Issue

**页面路径**: `/{owner}/{repo}/issues/new`

**关键元素选择器**:

```javascript
{
  // Issue 标题输入框
  titleInput: {
    selector: 'input[name="issue[title]"]',
    // 或者使用 ID: '#issue_title'
    description: 'Issue 标题输入框',
    type: 'input'
  },
  
  // Issue 内容编辑器（Markdown 编辑器）
  bodyEditor: {
    selector: 'textarea[name="issue[body]"]',
    // 或者使用 ID: '#issue_body'
    // 注意：GitHub 使用 CodeMirror，可能需要特殊处理
    description: 'Issue 内容编辑器',
    type: 'textarea'
  },
  
  // 提交按钮
  submitButton: {
    selector: 'button[type="submit"]',
    // 或者更具体: 'button.btn-primary[type="submit"]'
    // 文本内容通常包含 "Submit new issue"
    description: '提交 Issue 按钮',
    type: 'button'
  },
  
  // 取消按钮
  cancelButton: {
    selector: 'a[href*="/issues"]',
    // 或者: 'button.btn-secondary'
    description: '取消按钮',
    type: 'link'
  }
}
```

**操作流程**:
1. 定位标题输入框：`input[name="issue[title]"]`
2. 填充标题内容
3. 定位内容编辑器：`textarea[name="issue[body]"]`
4. 填充 Issue 内容
5. 点击提交按钮：`button[type="submit"]`

### 2. 编辑 Issue

**页面路径**: `/{owner}/{repo}/issues/{number}`

**关键元素选择器**:

```javascript
{
  // 编辑标题按钮
  editTitleButton: {
    selector: 'button[aria-label="Edit title"]',
    description: '编辑标题按钮',
    type: 'button'
  },
  
  // 编辑内容按钮
  editBodyButton: {
    selector: 'button[aria-label="Edit comment"]',
    // 或者: 'button[data-action="edit"]'
    description: '编辑内容按钮',
    type: 'button'
  },
  
  // 保存按钮
  saveButton: {
    selector: 'button[type="submit"]',
    // 文本内容通常包含 "Update comment" 或 "Save"
    description: '保存更改按钮',
    type: 'button'
  }
}
```

### 3. 创建 Pull Request

**页面路径**: `/{owner}/{repo}/compare/**` 或 `/{owner}/{repo}/pull/new/**`

**关键元素选择器**:

```javascript
{
  // PR 标题输入框
  titleInput: {
    selector: 'input[name="pull_request[title]"]',
    // 或者: '#pull_request_title'
    description: 'PR 标题输入框',
    type: 'input'
  },
  
  // PR 内容编辑器
  bodyEditor: {
    selector: 'textarea[name="pull_request[body]"]',
    // 或者: '#pull_request_body'
    description: 'PR 内容编辑器',
    type: 'textarea'
  },
  
  // 创建 PR 按钮
  createButton: {
    selector: 'button[type="submit"]',
    // 文本内容通常包含 "Create pull request"
    description: '创建 PR 按钮',
    type: 'button'
  }
}
```

### 4. 搜索功能

**页面路径**: 任何 GitHub 页面

**关键元素选择器**:

```javascript
{
  // 全局搜索框
  searchInput: {
    selector: 'input[placeholder*="Search"]',
    // 或者: 'input[type="search"]'
    // 或者更具体: 'input.header-search-input'
    description: '全局搜索输入框',
    type: 'input'
  },
  
  // 仓库内搜索框
  repoSearchInput: {
    selector: 'input[placeholder*="Search or jump to"]',
    // 或者: 'input[data-unscoped-placeholder*="Search"]'
    description: '仓库内搜索输入框',
    type: 'input'
  }
}
```

### 5. 文件操作

**页面路径**: `/{owner}/{repo}` 或文件浏览页面

**关键元素选择器**:

```javascript
{
  // 创建新文件按钮
  createFileButton: {
    selector: 'a[href*="/new/"]',
    // 或者: 'a[aria-label="Create new file"]'
    description: '创建新文件按钮',
    type: 'link'
  },
  
  // 上传文件按钮
  uploadFileButton: {
    selector: 'a[href*="/upload"]',
    // 或者: 'a[aria-label="Upload files"]'
    description: '上传文件按钮',
    type: 'link'
  },
  
  // 文件编辑器（创建/编辑文件时）
  fileEditor: {
    selector: 'textarea[data-codemirror]',
    // 或者: 'textarea.file-editor-textarea'
    description: '文件编辑器',
    type: 'textarea'
  },
  
  // 提交文件按钮
  commitButton: {
    selector: 'button[type="submit"]',
    // 文本内容通常包含 "Commit new file" 或 "Commit changes"
    description: '提交文件按钮',
    type: 'button'
  }
}
```

### 6. 评论和回复

**页面路径**: Issue/PR 详情页

**关键元素选择器**:

```javascript
{
  // 评论输入框
  commentInput: {
    selector: 'textarea[name="comment[body]"]',
    // 或者: 'textarea[aria-label="Leave a comment"]'
    description: '评论输入框',
    type: 'textarea'
  },
  
  // 提交评论按钮
  commentSubmitButton: {
    selector: 'button[type="submit"]',
    // 文本内容通常包含 "Comment" 或 "Add comment"
    description: '提交评论按钮',
    type: 'button'
  },
  
  // 回复按钮
  replyButton: {
    selector: 'button[aria-label="Reply"]',
    description: '回复按钮',
    type: 'button'
  }
}
```

## 使用指南

### 基本使用模式

当需要在 GitHub 上执行操作时，使用本 skill 提供的选择器信息：

1. **识别操作类型**: 确定要执行的操作（创建 issue、提交 PR 等）
2. **查找对应选择器**: 从上述列表中找到相关的 DOM 选择器
3. **执行操作**: 使用 `page_action` 工具，直接使用预定义的选择器

### 示例：创建 Issue

```javascript
// 使用预定义的选择器创建 Issue
const actions = [
  {
    action: 'fill',
    target: {
      selector: 'input[name="issue[title]"]'
    },
    params: {
      value: 'Bug: 页面加载缓慢'
    }
  },
  {
    action: 'fill',
    target: {
      selector: 'textarea[name="issue[body]"]'
    },
    params: {
      value: '## 问题描述\n\n页面加载时间超过 5 秒...'
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

### 注意事项

1. **动态内容**: GitHub 使用 React，某些元素可能是动态加载的，需要等待元素出现
2. **CodeMirror 编辑器**: Issue/PR 内容编辑器使用 CodeMirror，可能需要特殊处理
3. **权限检查**: 某些操作需要特定权限，操作前应检查用户权限
4. **URL 匹配**: 确保当前页面 URL 匹配操作所需的页面路径

## 扩展信息

更多详细的 GitHub DOM 结构和操作模式，请参考：
- [references/github-dom-selectors.md](references/github-dom-selectors.md) - 完整的 DOM 选择器参考
- [references/github-workflows.md](references/github-workflows.md) - 常见工作流程示例

## 最佳实践

1. **优先使用属性选择器**: `name`、`type`、`aria-label` 等属性选择器比 class 选择器更稳定
2. **组合选择器**: 当单个选择器不够精确时，可以组合多个属性
3. **等待元素**: 对于动态加载的内容，使用 `wait` 操作等待元素出现
4. **验证操作**: 操作后验证结果，确保操作成功
