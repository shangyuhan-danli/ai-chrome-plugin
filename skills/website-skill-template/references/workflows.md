# 网站操作工作流程示例

本文档提供了目标网站常见操作的完整工作流程示例，展示如何使用预定义的 DOM 选择器执行复杂操作。

## 目录

- [搜索流程](#搜索流程)
- [登录流程](#登录流程)
- [表单提交流程](#表单提交流程)
- [数据提取流程](#数据提取流程)
- [购物流程](#购物流程)

## 搜索流程

### 基本搜索

**目标**: 在网站上搜索关键词

**步骤**:

```javascript
const actions = [
  // 1. 定位搜索输入框
  {
    action: 'fill',
    target: {
      selector: 'input[name="q"]'
    },
    params: {
      value: '搜索关键词'
    }
  },
  // 2. 点击搜索按钮
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
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

### 高级搜索

**目标**: 使用高级搜索功能

**步骤**:

```javascript
const actions = [
  // 1. 填写关键词
  {
    action: 'fill',
    target: {
      selector: 'input[name="keyword"]'
    },
    params: {
      value: '关键词'
    }
  },
  // 2. 选择分类
  {
    action: 'select',
    target: {
      selector: 'select[name="category"]'
    },
    params: {
      value: '分类值'
    }
  },
  // 3. 选择日期范围
  {
    action: 'fill',
    target: {
      selector: 'input[name="dateFrom"]'
    },
    params: {
      value: '2024-01-01'
    }
  },
  {
    action: 'fill',
    target: {
      selector: 'input[name="dateTo"]'
    },
    params: {
      value: '2024-12-31'
    }
  },
  // 4. 提交搜索
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  }
]
```

## 登录流程

### 基本登录

**目标**: 登录网站账户

**步骤**:

```javascript
const actions = [
  // 1. 填写用户名
  {
    action: 'fill',
    target: {
      selector: 'input[name="username"]'
    },
    params: {
      value: '用户名'
    }
  },
  // 2. 填写密码
  {
    action: 'fill',
    target: {
      selector: 'input[name="password"]'
    },
    params: {
      value: '密码'
    }
  },
  // 3. （可选）勾选记住我
  {
    action: 'check',
    target: {
      selector: 'input[type="checkbox"][name="remember"]'
    }
  },
  // 4. 点击登录按钮
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  },
  // 5. 等待登录完成
  {
    action: 'wait',
    params: {
      timeout: 2000
    }
  }
]
```

### 带验证码的登录

**目标**: 处理需要验证码的登录

**步骤**:

```javascript
const actions = [
  // 1-2. 填写用户名和密码（同上）
  {
    action: 'fill',
    target: {
      selector: 'input[name="username"]'
    },
    params: {
      value: '用户名'
    }
  },
  {
    action: 'fill',
    target: {
      selector: 'input[name="password"]'
    },
    params: {
      value: '密码'
    }
  },
  // 3. 等待验证码输入框出现
  {
    action: 'wait',
    target: {
      selector: 'input[name="captcha"]'
    },
    params: {
      timeout: 2000
    }
  },
  // 4. 提示用户输入验证码（需要用户交互）
  // 注意：验证码通常需要用户手动输入
  {
    action: 'fill',
    target: {
      selector: 'input[name="captcha"]'
    },
    params: {
      value: '验证码' // 这里需要用户提供
    }
  },
  // 5. 提交登录
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  }
]
```

## 表单提交流程

### 联系表单

**目标**: 提交联系表单

**步骤**:

```javascript
const actions = [
  // 1. 填写姓名
  {
    action: 'fill',
    target: {
      selector: 'input[name="name"]'
    },
    params: {
      value: '张三'
    }
  },
  // 2. 填写邮箱
  {
    action: 'fill',
    target: {
      selector: 'input[name="email"]'
    },
    params: {
      value: 'zhangsan@example.com'
    }
  },
  // 3. 填写主题
  {
    action: 'fill',
    target: {
      selector: 'input[name="subject"]'
    },
    params: {
      value: '咨询问题'
    }
  },
  // 4. 填写消息内容
  {
    action: 'fill',
    target: {
      selector: 'textarea[name="message"]'
    },
    params: {
      value: '这是消息内容...'
    }
  },
  // 5. 提交表单
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  },
  // 6. 等待提交完成
  {
    action: 'wait',
    params: {
      timeout: 2000
    }
  }
]
```

### 文件上传表单

**目标**: 上传文件并提交表单

**步骤**:

```javascript
const actions = [
  // 1. 填写其他字段
  {
    action: 'fill',
    target: {
      selector: 'input[name="title"]'
    },
    params: {
      value: '文件标题'
    }
  },
  // 2. 上传文件
  {
    action: 'upload',
    target: {
      selector: 'input[type="file"][name="file"]'
    },
    params: {
      filePath: '/path/to/file.pdf' // 文件路径
    }
  },
  // 3. 等待文件上传完成
  {
    action: 'wait',
    params: {
      timeout: 5000
    }
  },
  // 4. 提交表单
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  }
]
```

## 数据提取流程

### 提取列表数据

**目标**: 从列表页面提取数据

**步骤**:

```javascript
const actions = [
  // 1. 等待列表加载
  {
    action: 'wait',
    target: {
      selector: '.item-list .item'
    },
    params: {
      timeout: 3000
    }
  },
  // 2. 读取列表项（需要多次执行或使用 evaluate）
  {
    action: 'read',
    target: {
      selector: '.item-list .item'
    }
  },
  // 3. 如果需要翻页，点击下一页
  {
    action: 'click',
    target: {
      selector: '.pagination .next'
    }
  }
]
```

### 提取详情页数据

**目标**: 从详情页提取信息

**步骤**:

```javascript
const actions = [
  // 1. 等待页面加载
  {
    action: 'wait',
    params: {
      timeout: 2000
    }
  },
  // 2. 读取标题
  {
    action: 'read',
    target: {
      selector: 'h1.item-title'
    }
  },
  // 3. 读取描述
  {
    action: 'read',
    target: {
      selector: '.item-description'
    }
  },
  // 4. 读取价格
  {
    action: 'read',
    target: {
      selector: '.item-price'
    }
  }
]
```

## 购物流程

### 添加到购物车

**目标**: 将商品添加到购物车

**步骤**:

```javascript
const actions = [
  // 1. 选择商品规格（如果有）
  {
    action: 'select',
    target: {
      selector: 'select[name="size"]'
    },
    params: {
      value: 'M'
    }
  },
  // 2. 选择数量
  {
    action: 'fill',
    target: {
      selector: 'input[name="quantity"]'
    },
    params: {
      value: '2'
    }
  },
  // 3. 点击添加到购物车
  {
    action: 'click',
    target: {
      selector: 'button.add-to-cart'
    }
  },
  // 4. 等待添加完成
  {
    action: 'wait',
    params: {
      timeout: 2000
    }
  }
]
```

### 结算流程

**目标**: 完成购物车结算

**步骤**:

```javascript
const actions = [
  // 1. 进入购物车页面
  {
    action: 'navigate',
    params: {
      url: '/cart'
    }
  },
  // 2. 等待购物车加载
  {
    action: 'wait',
    target: {
      selector: '.cart-items'
    },
    params: {
      timeout: 2000
    }
  },
  // 3. 点击结算按钮
  {
    action: 'click',
    target: {
      selector: 'button.checkout'
    }
  },
  // 4. 填写收货地址（在结算页面）
  {
    action: 'fill',
    target: {
      selector: 'input[name="address"]'
    },
    params: {
      value: '收货地址'
    }
  },
  // 5. 选择支付方式
  {
    action: 'click',
    target: {
      selector: 'input[type="radio"][name="payment"][value="alipay"]'
    }
  },
  // 6. 提交订单
  {
    action: 'click',
    target: {
      selector: 'button[type="submit"]'
    }
  }
]
```

## 最佳实践

### 1. 等待元素出现

对于动态加载的内容，始终先等待元素出现：

```javascript
{
  action: 'wait',
  target: {
    selector: '.dynamic-content'
  },
  params: {
    timeout: 5000
  }
}
```

### 2. 滚动到元素

如果元素不在可视区域，先滚动到元素：

```javascript
{
  action: 'scrollIntoView',
  target: {
    selector: '.target-element'
  }
}
```

### 3. 错误处理

操作后验证结果：

```javascript
// 提交后检查是否成功
{
  action: 'read',
  target: {
    selector: '.success-message'
  }
}
```

### 4. 使用备用选择器

当主要选择器失败时，尝试备用选择器：

```javascript
// 优先使用主选择器
const primarySelector = 'input[name="q"]';
// 如果失败，使用备用选择器
const fallbackSelectors = ['#search-input', '.search-box input'];
```

### 5. 批量操作

对于多个相似操作，使用循环或批量处理：

```javascript
// 填充多个字段
const fields = [
  { selector: 'input[name="name"]', value: '姓名' },
  { selector: 'input[name="email"]', value: '邮箱' },
  { selector: 'input[name="phone"]', value: '电话' }
];

const actions = fields.map(field => ({
  action: 'fill',
  target: { selector: field.selector },
  params: { value: field.value }
}));
```
