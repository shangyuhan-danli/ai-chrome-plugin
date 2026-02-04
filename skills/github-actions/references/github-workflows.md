# GitHub 常见工作流程

本文档提供了 GitHub 常见操作的完整工作流程示例。

## 创建 Issue 完整流程

### 步骤 1: 导航到创建 Issue 页面

```javascript
{
  action: 'navigate',
  params: {
    url: 'https://github.com/{owner}/{repo}/issues/new'
  }
}
```

### 步骤 2: 等待页面加载

```javascript
{
  action: 'wait',
  params: {
    duration: 2000  // 等待 2 秒
  }
}
```

### 步骤 3: 填写 Issue 标题

```javascript
{
  action: 'fill',
  target: {
    selector: 'input[name="issue[title]"]'
  },
  params: {
    value: 'Bug: 页面加载缓慢'
  }
}
```

### 步骤 4: 填写 Issue 内容

```javascript
{
  action: 'fill',
  target: {
    selector: 'textarea[name="issue[body]"]'
  },
  params: {
    value: '## 问题描述\n\n页面加载时间超过 5 秒，影响用户体验。\n\n## 复现步骤\n\n1. 打开页面\n2. 观察加载时间\n\n## 预期行为\n\n页面应在 2 秒内加载完成。'
  }
}
```

### 步骤 5: 提交 Issue

```javascript
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}
```

### 步骤 6: 验证创建成功

```javascript
{
  action: 'wait',
  params: {
    duration: 3000  // 等待页面跳转
  }
}
```

## 创建 Pull Request 完整流程

### 步骤 1: Fork 仓库（如果需要）

```javascript
{
  action: 'click',
  target: {
    selector: 'button[aria-label*="Fork"]'
  }
}
```

### 步骤 2: 创建新分支并编辑文件

```javascript
// 导航到文件
{
  action: 'navigate',
  params: {
    url: 'https://github.com/{owner}/{repo}/blob/main/README.md'
  }
}

// 点击编辑按钮
{
  action: 'click',
  target: {
    selector: 'a[href*="/edit/"]'
  }
}

// 等待编辑器加载
{
  action: 'wait',
  params: {
    duration: 2000
  }
}

// 编辑文件内容
{
  action: 'fill',
  target: {
    selector: 'textarea[data-codemirror]'
  },
  params: {
    value: '// 新的文件内容'
  }
}

// 填写提交信息
{
  action: 'fill',
  target: {
    selector: 'input[name="message"]'
  },
  params: {
    value: 'Update README.md'
  }
}

// 选择创建新分支
{
  action: 'click',
  target: {
    selector: 'input[name="target_branch"]'
  }
}

// 提交更改
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}
```

### 步骤 3: 创建 Pull Request

```javascript
// 等待页面跳转到 PR 创建页面
{
  action: 'wait',
  params: {
    duration: 3000
  }
}

// 填写 PR 标题
{
  action: 'fill',
  target: {
    selector: 'input[name="pull_request[title]"]'
  },
  params: {
    value: 'Update README.md'
  }
}

// 填写 PR 描述
{
  action: 'fill',
  target: {
    selector: 'textarea[name="pull_request[body]"]'
  },
  params: {
    value: '## 更改说明\n\n更新了 README.md 文件的内容。'
  }
}

// 创建 PR
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}
```

## 搜索和浏览流程

### 搜索仓库

```javascript
// 点击搜索框
{
  action: 'click',
  target: {
    selector: 'input.header-search-input'
  }
}

// 输入搜索关键词
{
  action: 'type',
  target: {
    selector: 'input.header-search-input'
  },
  params: {
    text: 'react typescript'
  }
}

// 按 Enter 提交搜索
{
  action: 'press',
  target: {
    selector: 'input.header-search-input'
  },
  params: {
    key: 'Enter'
  }
}
```

### 浏览文件树

```javascript
// 展开文件夹
{
  action: 'click',
  target: {
    selector: 'a[href*="/tree/"][title*="文件夹名"]'
  }
}

// 查看文件
{
  action: 'click',
  target: {
    selector: 'a[href*="/blob/"][title*="文件名"]'
  }
}
```

## 评论和互动流程

### 在 Issue 中添加评论

```javascript
// 滚动到评论区域
{
  action: 'scroll',
  params: {
    direction: 'down',
    amount: 500
  }
}

// 点击评论输入框
{
  action: 'click',
  target: {
    selector: 'textarea[name="comment[body]"]'
  }
}

// 输入评论内容
{
  action: 'fill',
  target: {
    selector: 'textarea[name="comment[body]"]'
  },
  params: {
    value: '这是一个评论。'
  }
}

// 提交评论
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}
```

### 回复评论

```javascript
// 点击回复按钮
{
  action: 'click',
  target: {
    selector: 'button[aria-label="Reply"]'
  }
}

// 输入回复内容
{
  action: 'fill',
  target: {
    selector: 'textarea[name="comment[body]"]'
  },
  params: {
    value: '这是回复内容。'
  }
}

// 提交回复
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}
```

## 标签和分配流程

### 为 Issue 添加标签

```javascript
// 点击标签按钮
{
  action: 'click',
  target: {
    selector: 'button[aria-label="Add labels"]'
  }
}

// 等待标签选择器出现
{
  action: 'wait',
  params: {
    duration: 1000
  }
}

// 选择标签（示例：选择 "bug" 标签）
{
  action: 'click',
  target: {
    selector: 'input[value="bug"]'
  }
}

// 关闭标签选择器
{
  action: 'click',
  target: {
    selector: 'button[aria-label="Add labels"]'
  }
}
```

### 分配 Issue 给用户

```javascript
// 点击分配按钮
{
  action: 'click',
  target: {
    selector: 'button[aria-label="Assignees"]'
  }
}

// 等待分配器出现
{
  action: 'wait',
  params: {
    duration: 1000
  }
}

// 搜索用户
{
  action: 'type',
  target: {
    selector: 'input[placeholder*="username"]'
  },
  params: {
    text: 'username'
  }
}

// 选择用户
{
  action: 'click',
  target: {
    selector: 'div[role="option"]'  // 第一个匹配的用户
  }
}
```

## 错误处理最佳实践

### 1. 等待元素出现

```javascript
// 使用 wait 操作等待元素加载
{
  action: 'wait',
  params: {
    duration: 2000
  }
}

// 然后尝试操作元素
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}
```

### 2. 验证操作结果

```javascript
// 操作后检查 URL 变化
{
  action: 'read',
  target: {
    selector: 'window.location.href'  // 检查当前 URL
  }
}

// 或者检查页面元素
{
  action: 'read',
  target: {
    selector: 'div.flash-message'  // 检查成功/错误消息
  }
}
```

### 3. 处理动态内容

```javascript
// 对于动态加载的内容，使用多次尝试
// 第一次尝试
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}

// 如果失败，等待后重试
{
  action: 'wait',
  params: {
    duration: 1000
  }
}

// 再次尝试
{
  action: 'click',
  target: {
    selector: 'button[type="submit"]'
  }
}
```

## 性能优化建议

1. **批量操作**: 将多个操作组合在一起执行，减少页面刷新
2. **智能等待**: 只在必要时等待，避免不必要的延迟
3. **选择器缓存**: 复用已验证的选择器，避免重复查找
4. **错误恢复**: 实现重试机制，处理临时网络问题
