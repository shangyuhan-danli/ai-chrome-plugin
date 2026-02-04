# 网页内容提取模式参考

本文档提供了各种网页内容提取的详细模式和最佳实践。

## 目录

- [表格提取模式](#表格提取模式)
- [列表提取模式](#列表提取模式)
- [卡片提取模式](#卡片提取模式)
- [动态内容处理](#动态内容处理)
- [登录页面处理](#登录页面处理)
- [SPA应用处理](#spa应用处理)

## 表格提取模式

### 标准HTML表格

```javascript
// 提取标准表格
const data = extractData({
  dataType: 'table',
  selector: '#data-table'
})

// 返回结构:
{
  type: 'table',
  data: [
    { '名称': '商品A', '价格': '¥100', '库存': '50' },
    { '名称': '商品B', '价格': '¥200', '库存': '30' }
  ],
  fields: ['名称', '价格', '库存'],
  count: 2
}
```

### 复杂表格（包含链接、图片）

```javascript
// 提取包含链接和图片的表格
const data = extractData({
  dataType: 'table',
  selector: '.product-table'
})

// 返回结构包含关联数据:
{
  data: [
    {
      '名称': '商品A',
      '名称_link': 'https://example.com/product-a',
      '图片': 'https://example.com/image.jpg',
      '价格': '¥100'
    }
  ]
}
```

### 分页表格

```javascript
// 提取分页表格的所有数据
let allData = []
let page = 1

while (true) {
  // 等待表格加载
  await waitForElement('.data-table')
  
  // 提取当前页数据
  const pageData = extractData({
    dataType: 'table',
    selector: '.data-table'
  })
  
  allData.push(...pageData.data)
  
  // 检查是否有下一页
  const nextButton = document.querySelector('.pagination .next')
  if (!nextButton || nextButton.disabled) {
    break
  }
  
  // 点击下一页
  nextButton.click()
  
  // 等待新页面加载
  await wait(2000)
  page++
}

return { type: 'table', data: allData, count: allData.length }
```

## 列表提取模式

### 简单列表

```javascript
// 提取无序/有序列表
const data = extractData({
  dataType: 'list',
  selector: '.item-list'
})

// 返回结构:
{
  type: 'list',
  data: [
    { index: 1, text: '项目1', link: '...', linkText: '...' },
    { index: 2, text: '项目2', link: '...', linkText: '...' }
  ],
  count: 2
}
```

### 嵌套列表

```javascript
// 提取嵌套列表（自动处理嵌套结构）
const data = extractData({
  dataType: 'list',
  selector: '.nested-list'
})

// 返回结构包含children:
{
  data: [
    {
      index: 1,
      text: '父项目1',
      children: [
        { index: 1, text: '子项目1-1' },
        { index: 2, text: '子项目1-2' }
      ]
    }
  ]
}
```

### 动态加载列表

```javascript
// 处理需要滚动加载的列表
const actions = [
  // 1. 初始提取
  {
    action: 'extract',
    params: { dataType: 'list', selector: '.item-list' }
  },
  // 2. 滚动到底部
  {
    action: 'scroll',
    params: { direction: 'down', amount: 1000 }
  },
  // 3. 等待新内容加载
  {
    action: 'wait',
    target: { selector: '.new-item' },
    params: { timeout: 3000 }
  },
  // 4. 再次提取
  {
    action: 'extract',
    params: { dataType: 'list', selector: '.item-list' }
  }
]
```

## 卡片提取模式

### 商品卡片

```javascript
// 提取商品卡片
const data = extractData({
  dataType: 'cards',
  selector: '.product-grid'
})

// 返回结构:
{
  type: 'cards',
  data: [
    {
      title: '商品名称',
      description: '商品描述',
      image: 'https://...',
      price: '¥100',
      link: 'https://...',
      text: '完整文本内容'
    }
  ],
  count: 12
}
```

### 文章卡片

```javascript
// 提取文章列表卡片
const data = extractData({
  dataType: 'cards',
  selector: '.article-list'
})

// 返回结构包含文章信息:
{
  data: [
    {
      title: '文章标题',
      description: '文章摘要',
      image: 'https://...',
      link: 'https://...',
      // 可以进一步提取文章详情
    }
  ]
}
```

### 无限滚动卡片

```javascript
// 处理无限滚动的卡片列表
let allCards = []
let previousCount = 0

while (true) {
  // 滚动到底部
  window.scrollTo(0, document.body.scrollHeight)
  
  // 等待新内容加载
  await wait(2000)
  
  // 提取当前所有卡片
  const currentData = extractData({
    dataType: 'cards',
    selector: '.card-container'
  })
  
  // 检查是否有新内容
  if (currentData.count === previousCount) {
    // 没有新内容，停止
    break
  }
  
  allCards = currentData.data
  previousCount = currentData.count
}

return { type: 'cards', data: allCards, count: allCards.length }
```

## 动态内容处理

### 等待JavaScript渲染

```javascript
// 等待React/Vue组件渲染完成
const actions = [
  {
    action: 'wait',
    target: { selector: '[data-reactroot], [data-vue-app]' },
    params: { timeout: 5000 }
  },
  {
    action: 'wait',
    params: { timeout: 2000 } // 额外等待确保内容加载
  },
  {
    action: 'extract',
    params: { dataType: 'table' }
  }
]
```

### 点击加载更多

```javascript
// 处理"加载更多"按钮
const actions = [
  // 1. 提取初始数据
  {
    action: 'extract',
    params: { dataType: 'cards' }
  },
  // 2. 点击"加载更多"
  {
    action: 'click',
    target: { selector: '.load-more-button' }
  },
  // 3. 等待新内容
  {
    action: 'wait',
    target: { selector: '.new-card' },
    params: { timeout: 3000 }
  },
  // 4. 再次提取
  {
    action: 'extract',
    params: { dataType: 'cards' }
  }
]
```

### 处理懒加载图片

```javascript
// 等待懒加载图片加载完成
const actions = [
  {
    action: 'scroll',
    params: { direction: 'down', amount: 500 }
  },
  {
    action: 'wait',
    params: { timeout: 1000 } // 等待图片加载
  },
  {
    action: 'scroll',
    params: { direction: 'down', amount: 500 }
  },
  {
    action: 'wait',
    params: { timeout: 1000 }
  },
  {
    action: 'extract',
    params: { dataType: 'cards' }
  }
]
```

## 登录页面处理

### 使用浏览器登录状态

```javascript
// 优势：自动使用浏览器已有的登录状态
// 无需处理Cookie、Session等

// 1. 用户已在浏览器中登录
// 2. 直接访问需要登录的页面
const data = extractData({
  dataType: 'table',
  selector: '.member-data'
})

// 自动使用浏览器的Cookie和Session
```

### 处理登录流程（如果需要）

```javascript
// 如果需要自动登录
const loginActions = [
  {
    action: 'fill',
    target: { selector: 'input[name="username"]' },
    params: { value: 'username' }
  },
  {
    action: 'fill',
    target: { selector: 'input[type="password"]' },
    params: { value: 'password' }
  },
  {
    action: 'click',
    target: { selector: 'button[type="submit"]' }
  },
  {
    action: 'wait',
    params: { timeout: 3000 }
  }
]

// 登录后提取数据
const data = extractData({ dataType: 'table' })
```

## SPA应用处理

### React应用

```javascript
// 处理React单页应用
const actions = [
  // 1. 等待React应用加载
  {
    action: 'wait',
    target: { selector: '[data-reactroot], #root' },
    params: { timeout: 5000 }
  },
  // 2. 点击导航
  {
    action: 'click',
    target: { selector: 'a[href*="/products"]' }
  },
  // 3. 等待路由切换和内容加载
  {
    action: 'wait',
    params: { timeout: 3000 }
  },
  // 4. 提取数据
  {
    action: 'extract',
    params: { dataType: 'cards' }
  }
]
```

### Vue应用

```javascript
// 处理Vue单页应用
const actions = [
  {
    action: 'wait',
    target: { selector: '[data-vue-app], #app' },
    params: { timeout: 5000 }
  },
  {
    action: 'click',
    target: { selector: 'router-link[to="/products"]' }
  },
  {
    action: 'wait',
    params: { timeout: 3000 }
  },
  {
    action: 'extract',
    params: { dataType: 'cards' }
  }
]
```

### 处理路由变化

```javascript
// 监听URL变化，确保内容已加载
function waitForRouteChange(targetUrl) {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.location.href.includes(targetUrl)) {
        clearInterval(checkInterval)
        setTimeout(resolve, 1000) // 额外等待确保内容加载
      }
    }, 100)
    
    setTimeout(() => {
      clearInterval(checkInterval)
      resolve() // 超时也resolve
    }, 10000)
  })
}
```

## 最佳实践

### 1. 总是等待内容加载

```javascript
// ✅ 正确：先等待再提取
{
  action: 'wait',
  target: { selector: '.data-container' },
  params: { timeout: 5000 }
}
{
  action: 'extract',
  params: { dataType: 'table' }
}

// ❌ 错误：直接提取可能失败
{
  action: 'extract',
  params: { dataType: 'table' }
}
```

### 2. 处理错误和重试

```javascript
async function extractWithRetry(selector, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const data = extractData({ selector, dataType: 'table' })
      if (data.count > 0) {
        return data
      }
    } catch (error) {
      console.warn(`提取失败 (尝试 ${i + 1}/${maxRetries}):`, error)
    }
    
    // 等待后重试
    await wait(2000)
  }
  
  throw new Error('提取失败，已达到最大重试次数')
}
```

### 3. 验证提取结果

```javascript
// 验证提取的数据是否符合预期
function validateExtractedData(data, expectedFields) {
  if (data.count === 0) {
    throw new Error('未提取到任何数据')
  }
  
  if (data.type === 'table' && data.fields) {
    const missingFields = expectedFields.filter(
      field => !data.fields.includes(field)
    )
    
    if (missingFields.length > 0) {
      console.warn('缺少预期字段:', missingFields)
    }
  }
  
  return data
}
```

### 4. 处理不同网站结构

```javascript
// 尝试多个选择器，找到可用的
function extractWithFallback(selectors) {
  for (const selector of selectors) {
    try {
      const data = extractData({
        selector,
        dataType: 'table'
      })
      
      if (data.count > 0) {
        return data
      }
    } catch (error) {
      continue
    }
  }
  
  throw new Error('所有选择器都失败')
}

// 使用示例
const data = extractWithFallback([
  '.product-table',
  '#data-table',
  'table.data-table',
  'table'
])
```
