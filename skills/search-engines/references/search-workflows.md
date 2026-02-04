# 搜索引擎操作工作流程示例

本文档提供了在主流搜索引擎上执行搜索操作的完整工作流程示例。

## 目录

- [百度搜索流程](#百度搜索流程)
- [Google 搜索流程](#google-搜索流程)
- [Bing 搜索流程](#bing-搜索流程)
- [通用搜索流程](#通用搜索流程)
- [高级搜索流程](#高级搜索流程)

## 百度搜索流程

### 基本搜索

**目标**: 在百度上搜索关键词

**步骤**:

```javascript
const actions = [
  // 1. 定位搜索输入框并填充关键词
  {
    action: 'fill',
    target: {
      selector: '#kw'
    },
    params: {
      value: 'AI 技术'
    }
  },
  // 2. 点击搜索按钮
  {
    action: 'click',
    target: {
      selector: '#su'
    }
  },
  // 3. 等待搜索结果加载
  {
    action: 'wait',
    params: {
      timeout: 3000
    }
  }
]
```

### 使用 Enter 键搜索（推荐）

```javascript
const actions = [
  {
    action: 'fill',
    target: {
      selector: '#kw'
    },
    params: {
      value: 'AI 技术'
    }
  },
  {
    action: 'press',
    target: {
      selector: '#kw'
    },
    params: {
      key: 'Enter'
    }
  }
]
```

### 选择搜索建议

**目标**: 从搜索建议中选择一项

```javascript
const actions = [
  // 1. 输入关键词（触发搜索建议）
  {
    action: 'fill',
    target: {
      selector: '#kw'
    },
    params: {
      value: 'AI'
    }
  },
  // 2. 等待搜索建议出现
  {
    action: 'wait',
    target: {
      selector: '.bdsug'
    },
    params: {
      timeout: 1000
    }
  },
  // 3. 点击第一个建议项
  {
    action: 'click',
    target: {
      selector: '.bdsug-item:first-child'
    }
  }
]
```

## Google 搜索流程

### 基本搜索

**目标**: 在 Google 上搜索关键词

**重要**: Google 使用 `textarea` 而不是 `input`！

**步骤**:

```javascript
const actions = [
  // 1. 定位搜索输入框（注意是 textarea）
  {
    action: 'fill',
    target: {
      selector: 'textarea[name="q"]'
    },
    params: {
      value: 'Chrome extension automation'
    }
  },
  // 2. 按 Enter 键搜索（推荐）
  {
    action: 'press',
    target: {
      selector: 'textarea[name="q"]'
    },
    params: {
      key: 'Enter'
    }
  }
]
```

### 使用搜索按钮

```javascript
const actions = [
  {
    action: 'fill',
    target: {
      selector: 'textarea[name="q"]'
    },
    params: {
      value: 'Chrome extension automation'
    }
  },
  {
    action: 'click',
    target: {
      selector: 'input[name="btnK"]'
    }
  }
]
```

### "手气不错"功能

**目标**: 使用 Google 的 "I'm Feeling Lucky" 功能

```javascript
const actions = [
  {
    action: 'fill',
    target: {
      selector: 'textarea[name="q"]'
    },
    params: {
      value: 'Chrome extension'
    }
  },
  {
    action: 'click',
    target: {
      selector: 'input[name="btnI"]'
    }
  }
]
```

## Bing 搜索流程

### 基本搜索

**目标**: 在 Bing 上搜索关键词

**步骤**:

```javascript
const actions = [
  // 1. 填充搜索关键词
  {
    action: 'fill',
    target: {
      selector: 'input[name="q"]'
    },
    params: {
      value: 'Microsoft Edge'
    }
  },
  // 2. 点击搜索按钮
  {
    action: 'click',
    target: {
      selector: '#search_icon'
    }
  }
]
```

### 使用 Enter 键

```javascript
const actions = [
  {
    action: 'fill',
    target: {
      selector: 'input[name="q"]'
    },
    params: {
      value: 'Microsoft Edge'
    }
  },
  {
    action: 'press',
    target: {
      selector: 'input[name="q"]'
    },
    params: {
      key: 'Enter'
    }
  }
]
```

## 通用搜索流程

### 自动识别搜索引擎

**目标**: 根据当前页面 URL 自动选择对应的选择器

```javascript
function getSearchActions(keyword, currentUrl) {
  let inputSelector, buttonSelector;
  
  if (currentUrl.includes('baidu.com')) {
    inputSelector = '#kw';
    buttonSelector = '#su';
  } else if (currentUrl.includes('google.com')) {
    inputSelector = 'textarea[name="q"]';
    buttonSelector = 'input[name="btnK"]';
  } else if (currentUrl.includes('bing.com')) {
    inputSelector = 'input[name="q"]';
    buttonSelector = '#search_icon';
  } else if (currentUrl.includes('sogou.com')) {
    inputSelector = '#query';
    buttonSelector = '#stb';
  } else {
    // 默认尝试通用选择器
    inputSelector = 'input[name="q"]';
    buttonSelector = 'button[type="submit"]';
  }
  
  return [
    {
      action: 'fill',
      target: { selector: inputSelector },
      params: { value: keyword }
    },
    {
      action: 'press',
      target: { selector: inputSelector },
      params: { key: 'Enter' }
    }
  ];
}

// 使用示例
const currentUrl = window.location.href;
const actions = getSearchActions('搜索关键词', currentUrl);
```

### 带错误处理的搜索

```javascript
async function searchWithFallback(keyword, currentUrl) {
  const selectors = getSearchSelectors(currentUrl);
  
  const actions = [
    // 1. 尝试填充主选择器
    {
      action: 'fill',
      target: { selector: selectors.input },
      params: { value: keyword }
    },
    // 2. 如果主选择器失败，尝试备用选择器
    ...(selectors.fallback || []).map(fallback => ({
      action: 'fill',
      target: { selector: fallback },
      params: { value: keyword }
    })),
    // 3. 按 Enter 键搜索
    {
      action: 'press',
      target: { selector: selectors.input },
      params: { key: 'Enter' }
    }
  ];
  
  return actions;
}
```

## 高级搜索流程

### 百度高级搜索

**目标**: 使用百度的高级搜索功能

```javascript
const actions = [
  // 1. 导航到高级搜索页面
  {
    action: 'navigate',
    params: {
      url: 'https://www.baidu.com/gaoji/advanced.html'
    }
  },
  // 2. 等待页面加载
  {
    action: 'wait',
    params: {
      timeout: 2000
    }
  },
  // 3. 填写包含全部关键词
  {
    action: 'fill',
    target: {
      selector: 'input[name="q1"]'
    },
    params: {
      value: 'AI 技术'
    }
  },
  // 4. 填写不包含关键词
  {
    action: 'fill',
    target: {
      selector: 'input[name="q4"]'
    },
    params: {
      value: '广告'
    }
  },
  // 5. 提交高级搜索
  {
    action: 'click',
    target: {
      selector: 'input[type="submit"]'
    }
  }
]
```

### Google 高级搜索

**目标**: 使用 Google 的高级搜索功能

```javascript
const actions = [
  // 1. 导航到高级搜索页面
  {
    action: 'navigate',
    params: {
      url: 'https://www.google.com/advanced_search'
    }
  },
  // 2. 等待页面加载
  {
    action: 'wait',
    params: {
      timeout: 2000
    }
  },
  // 3. 填写全部关键词
  {
    action: 'fill',
    target: {
      selector: 'input[name="as_q"]'
    },
    params: {
      value: 'Chrome extension'
    }
  },
  // 4. 填写精确匹配短语
  {
    action: 'fill',
    target: {
      selector: 'input[name="as_epq"]'
    },
    params: {
      value: 'automation'
    }
  },
  // 5. 选择语言
  {
    action: 'select',
    target: {
      selector: 'select[name="lr"]'
    },
    params: {
      value: 'lang_zh-CN'
    }
  },
  // 6. 提交搜索
  {
    action: 'click',
    target: {
      selector: 'input[type="submit"]'
    }
  }
]
```

## 最佳实践

### 1. 优先使用 Enter 键

Enter 键比点击按钮更可靠：

```javascript
// ✅ 推荐
{
  action: 'press',
  target: { selector: '#kw' },
  params: { key: 'Enter' }
}

// ⚠️ 备选
{
  action: 'click',
  target: { selector: '#su' }
}
```

### 2. 等待元素出现

对于动态加载的内容：

```javascript
{
  action: 'wait',
  target: {
    selector: '#kw'
  },
  params: {
    timeout: 2000
  }
}
```

### 3. 提供备用选择器

为关键元素提供备用选择器：

```javascript
const selectors = {
  input: '#kw',
  fallback: ['input[name="wd"]', '.s_ipt']
};
```

### 4. 验证搜索结果

搜索后验证是否成功：

```javascript
// 搜索后检查 URL 变化
const actions = [
  // ... 搜索操作
  {
    action: 'wait',
    params: {
      timeout: 3000
    }
  }
];

// 检查 URL 是否包含搜索关键词
const currentUrl = window.location.href;
if (currentUrl.includes('wd=') || currentUrl.includes('q=')) {
  console.log('搜索成功');
}
```

### 5. 处理搜索建议

如果出现搜索建议，可以选择：

```javascript
// 选项 1: 忽略建议，直接搜索
const actions = [
  { action: 'fill', target: { selector: '#kw' }, params: { value: 'AI' } },
  { action: 'press', target: { selector: '#kw' }, params: { key: 'Enter' } }
];

// 选项 2: 选择第一个建议
const actions = [
  { action: 'fill', target: { selector: '#kw' }, params: { value: 'AI' } },
  { action: 'wait', target: { selector: '.bdsug' }, params: { timeout: 1000 } },
  { action: 'click', target: { selector: '.bdsug-item:first-child' } }
];
```

## 演示示例

### 示例 1: 简单搜索演示

```javascript
// 用户请求: "搜索 AI 技术"
const actions = [
  {
    action: 'fill',
    target: { selector: '#kw' },
    params: { value: 'AI 技术' }
  },
  {
    action: 'press',
    target: { selector: '#kw' },
    params: { key: 'Enter' }
  }
];
```

### 示例 2: 多搜索引擎切换

```javascript
// 用户请求: "在百度搜索 AI，然后在 Google 搜索 Machine Learning"
const actions = [
  // 百度搜索
  {
    action: 'fill',
    target: { selector: '#kw' },
    params: { value: 'AI' }
  },
  {
    action: 'press',
    target: { selector: '#kw' },
    params: { key: 'Enter' }
  },
  {
    action: 'wait',
    params: { timeout: 3000 }
  },
  // 切换到 Google
  {
    action: 'navigate',
    params: { url: 'https://www.google.com' }
  },
  {
    action: 'wait',
    params: { timeout: 2000 }
  },
  // Google 搜索
  {
    action: 'fill',
    target: { selector: 'textarea[name="q"]' },
    params: { value: 'Machine Learning' }
  },
  {
    action: 'press',
    target: { selector: 'textarea[name="q"]' },
    params: { key: 'Enter' }
  }
];
```

### 示例 3: 带错误处理的搜索

```javascript
async function robustSearch(keyword, engine = 'baidu') {
  const selectors = {
    baidu: { input: '#kw', fallback: ['input[name="wd"]'] },
    google: { input: 'textarea[name="q"]', fallback: ['input[name="q"]'] },
    bing: { input: 'input[name="q"]', fallback: ['#sb_form_q'] }
  };
  
  const config = selectors[engine] || selectors.baidu;
  
  const actions = [
    {
      action: 'fill',
      target: { selector: config.input },
      params: { value: keyword }
    },
    {
      action: 'press',
      target: { selector: config.input },
      params: { key: 'Enter' }
    }
  ];
  
  return actions;
}
```
