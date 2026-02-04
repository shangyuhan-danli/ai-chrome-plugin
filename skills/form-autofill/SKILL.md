---
name: form-autofill
description: 自动填充复杂表单，包括注册表单、申请表单、联系表单等。通过预定义的字段映射和选择器，快速准确地填写多个表单字段，节省时间并减少错误。适用于需要填写大量信息的表单场景，如账号注册、信息申请、数据录入等。
---

# 表单自动填充 Skill

本 skill 提供了常见表单字段的 DOM 选择器映射和自动填充策略，帮助 AI 快速准确地填写复杂表单，避免手动逐个填写字段的繁琐操作。

## 适用场景

- ✅ **账号注册**: 快速填写注册表单（用户名、邮箱、密码等）
- ✅ **信息申请**: 自动填充申请表单（个人信息、联系方式等）
- ✅ **数据录入**: 批量录入结构化数据
- ✅ **联系表单**: 快速填写联系表单
- ✅ **调查问卷**: 自动填写调查问卷

## 核心功能

### 1. 智能字段识别

根据字段的 `name`、`id`、`placeholder`、`label` 等属性自动识别字段类型：

```javascript
{
  // 姓名字段识别
  name: {
    selectors: [
      'input[name*="name"][name*="full"]',
      'input[name*="姓名"]',
      'input[id*="name"]',
      'input[placeholder*="姓名"]'
    ],
    type: 'text'
  },
  
  // 邮箱字段识别
  email: {
    selectors: [
      'input[type="email"]',
      'input[name*="email"]',
      'input[name*="mail"]',
      'input[id*="email"]'
    ],
    type: 'email'
  },
  
  // 电话字段识别
  phone: {
    selectors: [
      'input[type="tel"]',
      'input[name*="phone"]',
      'input[name*="mobile"]',
      'input[name*="电话"]',
      'input[name*="手机"]'
    ],
    type: 'tel'
  }
}
```

### 2. 常见表单字段映射

#### 个人信息字段

| 字段类型 | 常见选择器模式 | 示例值 |
|---------|--------------|--------|
| 姓名 | `input[name*="name"]`, `input[id*="name"]` | "张三" |
| 邮箱 | `input[type="email"]`, `input[name*="email"]` | "zhangsan@example.com" |
| 电话 | `input[type="tel"]`, `input[name*="phone"]` | "13800138000" |
| 地址 | `input[name*="address"]`, `textarea[name*="address"]` | "北京市朝阳区..." |
| 邮编 | `input[name*="zip"]`, `input[name*="postal"]` | "100000" |
| 生日 | `input[type="date"]`, `input[name*="birth"]` | "1990-01-01" |

#### 账号相关字段

| 字段类型 | 常见选择器模式 | 说明 |
|---------|--------------|------|
| 用户名 | `input[name*="username"]`, `input[name*="user"]` | 账号用户名 |
| 密码 | `input[type="password"]` | 密码字段 |
| 确认密码 | `input[name*="confirm"]`, `input[name*="repeat"]` | 确认密码 |
| 验证码 | `input[name*="captcha"]`, `input[name*="code"]` | 验证码（需手动输入） |

#### 选择类字段

| 字段类型 | 常见选择器模式 | 说明 |
|---------|--------------|------|
| 性别 | `input[type="radio"][name*="gender"]`, `select[name*="gender"]` | 性别选择 |
| 国家/地区 | `select[name*="country"]`, `select[name*="region"]` | 国家选择 |
| 城市 | `select[name*="city"]` | 城市选择 |
| 同意条款 | `input[type="checkbox"][name*="agree"]` | 同意服务条款 |

### 3. 表单填充策略

#### 策略 1: 顺序填充

按照表单字段的自然顺序依次填充：

```javascript
const actions = [
  { action: 'fill', target: { selector: 'input[name="name"]' }, params: { value: '张三' } },
  { action: 'fill', target: { selector: 'input[name="email"]' }, params: { value: 'zhangsan@example.com' } },
  { action: 'fill', target: { selector: 'input[name="phone"]' }, params: { value: '13800138000' } },
  { action: 'select', target: { selector: 'select[name="city"]' }, params: { value: '北京' } },
  { action: 'check', target: { selector: 'input[name="agree"]' } },
  { action: 'click', target: { selector: 'button[type="submit"]' } }
]
```

#### 策略 2: 智能识别填充

根据字段类型自动匹配数据：

```javascript
function fillForm(formData) {
  const actions = []
  
  // 遍历表单数据，智能匹配字段
  for (const [fieldType, value] of Object.entries(formData)) {
    const selectors = getSelectorsForFieldType(fieldType)
    actions.push({
      action: 'fill',
      target: { selector: selectors[0] },
      params: { value }
    })
  }
  
  return actions
}
```

#### 策略 3: 等待和验证

对于动态加载的表单，先等待再填充：

```javascript
const actions = [
  // 等待表单加载
  {
    action: 'wait',
    target: { selector: 'form' },
    params: { timeout: 2000 }
  },
  // 填充字段
  { action: 'fill', target: { selector: 'input[name="name"]' }, params: { value: '张三' } },
  // 验证字段是否填充成功
  {
    action: 'getProperty',
    target: { selector: 'input[name="name"]' },
    params: { property: 'value' }
  }
]
```

## 使用指南

### 基本使用

当用户需要填写表单时，AI 可以：

1. **识别表单字段**: 分析页面上的表单字段类型
2. **匹配选择器**: 使用预定义的字段映射找到对应的选择器
3. **填充数据**: 按照用户提供的数据填充表单
4. **提交表单**: 自动点击提交按钮

### 示例 1: 注册表单

**用户请求**: "帮我填写注册表单，姓名：张三，邮箱：zhangsan@example.com，密码：123456"

```javascript
const actions = [
  {
    action: 'fill',
    target: { selector: 'input[name*="name"]' },
    params: { value: '张三' }
  },
  {
    action: 'fill',
    target: { selector: 'input[type="email"]' },
    params: { value: 'zhangsan@example.com' }
  },
  {
    action: 'fill',
    target: { selector: 'input[type="password"]:first-of-type' },
    params: { value: '123456' }
  },
  {
    action: 'fill',
    target: { selector: 'input[type="password"]:last-of-type' },
    params: { value: '123456' }
  },
  {
    action: 'click',
    target: { selector: 'button[type="submit"]' }
  }
]
```

### 示例 2: 联系表单

**用户请求**: "填写联系表单，姓名：李四，邮箱：lisi@example.com，电话：13900139000，留言：我想咨询产品信息"

```javascript
const actions = [
  { action: 'fill', target: { selector: 'input[name*="name"]' }, params: { value: '李四' } },
  { action: 'fill', target: { selector: 'input[type="email"]' }, params: { value: 'lisi@example.com' } },
  { action: 'fill', target: { selector: 'input[type="tel"]' }, params: { value: '13900139000' } },
  { action: 'fill', target: { selector: 'textarea[name*="message"]' }, params: { value: '我想咨询产品信息' } },
  { action: 'click', target: { selector: 'button[type="submit"]' } }
]
```

### 示例 3: 复杂申请表单

**用户请求**: "填写申请表单，使用我的个人信息"

```javascript
// 假设用户已保存个人信息模板
const personalInfo = {
  name: '王五',
  email: 'wangwu@example.com',
  phone: '13700137000',
  address: '上海市浦东新区...',
  city: '上海',
  zipCode: '200000'
}

const actions = [
  { action: 'fill', target: { selector: 'input[name*="name"]' }, params: { value: personalInfo.name } },
  { action: 'fill', target: { selector: 'input[type="email"]' }, params: { value: personalInfo.email } },
  { action: 'fill', target: { selector: 'input[type="tel"]' }, params: { value: personalInfo.phone } },
  { action: 'fill', target: { selector: 'textarea[name*="address"]' }, params: { value: personalInfo.address } },
  { action: 'select', target: { selector: 'select[name*="city"]' }, params: { value: personalInfo.city } },
  { action: 'fill', target: { selector: 'input[name*="zip"]' }, params: { value: personalInfo.zipCode } },
  { action: 'check', target: { selector: 'input[type="checkbox"][name*="agree"]' } },
  { action: 'click', target: { selector: 'button[type="submit"]' } }
]
```

## 字段识别规则

### 优先级顺序

1. **type 属性**: `input[type="email"]` > `input[type="tel"]` > `input[type="password"]`
2. **name 属性**: `input[name*="email"]` > `input[name*="mail"]`
3. **id 属性**: `input[id*="email"]`
4. **placeholder 属性**: `input[placeholder*="邮箱"]`
5. **label 关联**: 通过 `label[for="email"]` 找到对应的 input

### 常见字段模式

```javascript
const fieldPatterns = {
  // 姓名
  name: [
    'input[name*="name"][name*="full"]',
    'input[name*="姓名"]',
    'input[id*="name"]',
    'input[placeholder*="姓名"]'
  ],
  
  // 邮箱
  email: [
    'input[type="email"]',
    'input[name*="email"]',
    'input[name*="mail"]',
    'input[id*="email"]',
    'input[placeholder*="邮箱"]'
  ],
  
  // 电话
  phone: [
    'input[type="tel"]',
    'input[name*="phone"]',
    'input[name*="mobile"]',
    'input[name*="电话"]',
    'input[name*="手机"]',
    'input[placeholder*="手机"]'
  ],
  
  // 地址
  address: [
    'textarea[name*="address"]',
    'input[name*="address"]',
    'textarea[name*="地址"]',
    'input[name*="地址"]'
  ],
  
  // 密码
  password: [
    'input[type="password"]'
  ],
  
  // 确认密码
  confirmPassword: [
    'input[type="password"][name*="confirm"]',
    'input[type="password"][name*="repeat"]',
    'input[type="password"]:nth-of-type(2)'
  ]
}
```

## 注意事项

1. **验证码处理**: 验证码通常需要用户手动输入，AI 应该跳过或提示用户
2. **动态字段**: 某些字段可能动态加载，需要先等待再填充
3. **必填字段**: 优先填充必填字段（通常有 `required` 属性）
4. **字段顺序**: 按照表单的自然顺序填充，避免触发验证错误
5. **数据验证**: 填充后可以验证数据是否正确填充

## 最佳实践

1. **先识别后填充**: 先分析表单结构，再决定填充策略
2. **提供备用选择器**: 为关键字段提供多个备用选择器
3. **等待表单加载**: 对于动态表单，先等待再操作
4. **验证填充结果**: 填充后验证关键字段是否成功
5. **处理错误**: 如果某个字段填充失败，尝试备用选择器

## 扩展信息

更多详细的字段映射和操作模式，请参考：
- [references/field-mappings.md](references/field-mappings.md) - 完整的字段映射参考
- [references/form-workflows.md](references/form-workflows.md) - 表单填充流程示例
