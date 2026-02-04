/**
 * GitHub 创建 Issue 示例脚本
 * 
 * 这个脚本展示了如何使用预定义的 DOM 选择器在 GitHub 上创建 Issue
 * 
 * 注意：这是一个示例脚本，实际使用时应该通过 page_action 工具执行操作
 */

// 示例：创建 Issue 的操作序列
const createIssueActions = [
  {
    action: 'navigate',
    params: {
      url: 'https://github.com/{owner}/{repo}/issues/new'
    }
  },
  {
    action: 'wait',
    params: {
      duration: 2000
    }
  },
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
      value: '## 问题描述\n\n页面加载时间超过 5 秒。\n\n## 复现步骤\n\n1. 打开页面\n2. 观察加载时间'
    }
  },
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  }
]

// 导出供参考
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createIssueActions }
}
