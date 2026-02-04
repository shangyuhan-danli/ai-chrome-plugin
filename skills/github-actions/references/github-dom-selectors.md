# GitHub DOM 选择器完整参考

本文档提供了 GitHub 网站所有常见操作的详细 DOM 选择器信息。

## 目录

- [Issue 相关](#issue-相关)
- [Pull Request 相关](#pull-request-相关)
- [仓库操作](#仓库操作)
- [文件操作](#文件操作)
- [搜索功能](#搜索功能)
- [用户操作](#用户操作)
- [设置页面](#设置页面)

## Issue 相关

### 创建 Issue 页面

**URL 模式**: `/{owner}/{repo}/issues/new`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 标题输入框 | `input[name="issue[title]"]` | Issue 标题 |
| 标题输入框（备用） | `#issue_title` | 使用 ID 选择器 |
| 内容编辑器 | `textarea[name="issue[body]"]` | Issue 内容（Markdown） |
| 内容编辑器（备用） | `#issue_body` | 使用 ID 选择器 |
| 标签选择器 | `input[name="issue[label_ids][]"]` | 选择标签 |
| 分配人员 | `input[name="issue[assignee_ids][]"]` | 分配 Issue |
| 提交按钮 | `button[type="submit"]` | 创建 Issue |
| 取消链接 | `a[href*="/issues"]` | 返回 Issue 列表 |

### Issue 列表页面

**URL 模式**: `/{owner}/{repo}/issues`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 新建 Issue 按钮 | `a[href*="/issues/new"]` | 创建新 Issue |
| 搜索框 | `input[placeholder*="Search"]` | 搜索 Issues |
| Issue 项 | `div[aria-label*="Issue"]` | Issue 列表项 |
| 打开/关闭筛选 | `a[href*="is:open"]` 或 `a[href*="is:closed"]` | 筛选状态 |

### Issue 详情页面

**URL 模式**: `/{owner}/{repo}/issues/{number}`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 编辑标题按钮 | `button[aria-label="Edit title"]` | 编辑标题 |
| 编辑内容按钮 | `button[aria-label="Edit comment"]` | 编辑内容 |
| 关闭 Issue 按钮 | `button[name="comment_and_close"]` | 关闭 Issue |
| 重新打开按钮 | `button[name="comment_and_reopen"]` | 重新打开 |
| 评论输入框 | `textarea[name="comment[body]"]` | 添加评论 |
| 提交评论按钮 | `button[type="submit"]` | 提交评论 |
| 标签编辑 | `button[aria-label="Add labels"]` | 编辑标签 |
| 分配人员 | `button[aria-label="Assignees"]` | 分配人员 |

## Pull Request 相关

### 创建 PR 页面

**URL 模式**: `/{owner}/{repo}/compare/**` 或 `/{owner}/{repo}/pull/new/**`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 标题输入框 | `input[name="pull_request[title]"]` | PR 标题 |
| 标题输入框（备用） | `#pull_request_title` | 使用 ID |
| 内容编辑器 | `textarea[name="pull_request[body]"]` | PR 描述 |
| 内容编辑器（备用） | `#pull_request_body` | 使用 ID |
| 创建 PR 按钮 | `button[type="submit"]` | 创建 PR |
| 创建草稿按钮 | `button[name="draft"]` | 创建草稿 PR |

### PR 详情页面

**URL 模式**: `/{owner}/{repo}/pull/{number}`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 合并按钮 | `button[name="comment_and_button"]` | 合并 PR |
| 评论输入框 | `textarea[name="comment[body]"]` | 添加评论 |
| 批准按钮 | `button[name="comment_and_approve"]` | 批准 PR |
| 请求更改按钮 | `button[name="comment_and_reject"]` | 请求更改 |
| 关闭 PR 按钮 | `button[name="comment_and_close"]` | 关闭 PR |

## 仓库操作

### 仓库主页

**URL 模式**: `/{owner}/{repo}`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| Star 按钮 | `button[aria-label*="Star"]` | 收藏仓库 |
| Fork 按钮 | `button[aria-label*="Fork"]` | Fork 仓库 |
| Watch 按钮 | `button[aria-label*="Watch"]` | 关注仓库 |
| 代码标签页 | `a[href*="/tree/"]` | 代码页面 |
| Issues 标签页 | `a[href*="/issues"]` | Issues 页面 |
| Pull requests 标签页 | `a[href*="/pulls"]` | PR 页面 |
| 设置按钮 | `a[href*="/settings"]` | 仓库设置 |

### 仓库设置

**URL 模式**: `/{owner}/{repo}/settings/**`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 删除仓库按钮 | `button[data-testid*="delete"]` | 删除仓库（危险操作） |
| 重命名输入框 | `input[name="repository[name]"]` | 重命名仓库 |
| 描述输入框 | `textarea[name="repository[description]"]` | 仓库描述 |

## 文件操作

### 文件浏览页面

**URL 模式**: `/{owner}/{repo}/tree/**` 或 `/{owner}/{repo}/blob/**`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 创建文件按钮 | `a[href*="/new/"]` | 创建新文件 |
| 上传文件按钮 | `a[href*="/upload"]` | 上传文件 |
| 编辑文件按钮 | `a[href*="/edit/"]` | 编辑文件 |
| 删除文件按钮 | `a[href*="/delete/"]` | 删除文件 |
| 原始文件链接 | `a[href*="/raw/"]` | 查看原始文件 |

### 创建/编辑文件页面

**URL 模式**: `/{owner}/{repo}/new/**` 或 `/{owner}/{repo}/edit/**`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 文件名输入框 | `input[name="filename"]` | 文件名 |
| 文件编辑器 | `textarea[data-codemirror]` | 文件内容编辑器 |
| 文件编辑器（备用） | `textarea.file-editor-textarea` | 使用 class |
| 提交信息输入框 | `input[name="message"]` | 提交信息 |
| 扩展信息输入框 | `textarea[name="description"]` | 扩展描述 |
| 提交按钮 | `button[type="submit"]` | 提交文件 |
| 提交到新分支 | `input[name="target_branch"]` | 创建新分支 |

## 搜索功能

### 全局搜索

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 搜索输入框 | `input.header-search-input` | 全局搜索 |
| 搜索输入框（备用） | `input[placeholder*="Search"]` | 使用 placeholder |
| 高级搜索链接 | `a[href*="/search/advanced"]` | 高级搜索 |

### 仓库内搜索

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 代码搜索 | `input[placeholder*="Search or jump to"]` | 仓库内搜索 |
| 文件搜索 | `input[data-unscoped-placeholder*="Search"]` | 文件搜索 |

## 用户操作

### 用户设置

**URL 模式**: `/settings/**`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 个人资料设置 | `a[href*="/profile"]` | 个人资料 |
| 账户设置 | `a[href*="/account"]` | 账户设置 |
| 通知设置 | `a[href*="/notifications"]` | 通知设置 |

### 通知中心

**URL 模式**: `/notifications`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 全部标记为已读 | `button[aria-label*="Mark all"]` | 标记所有通知 |
| 通知项 | `div[role="listitem"]` | 通知列表项 |

## 设置页面

### 仓库设置 - 通用

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 保存按钮 | `button[type="submit"]` | 保存设置 |
| 取消按钮 | `a[href*="/settings"]` | 取消更改 |

### 仓库设置 - 分支保护

**URL 模式**: `/{owner}/{repo}/settings/branches`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 添加规则按钮 | `button[data-testid*="add-rule"]` | 添加分支保护规则 |
| 分支名称输入框 | `input[name="branch_name"]` | 分支名称 |

## 选择器优先级建议

1. **优先使用**: `name` 属性选择器（最稳定）
2. **其次使用**: `id` 选择器（如果存在）
3. **再次使用**: `aria-label` 属性（语义化，较稳定）
4. **最后使用**: `class` 选择器（可能变化）

## 常见问题

### CodeMirror 编辑器处理

GitHub 使用 CodeMirror 作为代码编辑器，直接操作 `textarea` 可能不够。建议：

1. 先定位到 `textarea` 元素
2. 使用 `fill` 操作填充内容
3. 如果失败，尝试触发 CodeMirror 的更新事件

### 动态加载内容

GitHub 使用 React，某些内容可能动态加载：

1. 使用 `wait` 操作等待元素出现
2. 设置合理的超时时间
3. 检查元素是否可见（`isVisible`）

### 权限检查

某些操作需要特定权限：

1. 检查按钮是否禁用（`disabled` 属性）
2. 检查是否有权限提示
3. 操作前验证用户权限
