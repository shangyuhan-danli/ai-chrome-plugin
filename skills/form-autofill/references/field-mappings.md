# 表单字段映射完整参考

本文档提供了所有常见表单字段的详细选择器映射规则。

## 目录

- [个人信息字段](#个人信息字段)
- [账号相关字段](#账号相关字段)
- [联系信息字段](#联系信息字段)
- [地址相关字段](#地址相关字段)
- [选择类字段](#选择类字段)
- [文件上传字段](#文件上传字段)
- [特殊字段](#特殊字段)

## 个人信息字段

### 姓名

| 字段类型 | 选择器模式 | 优先级 | 示例值 |
|---------|-----------|--------|--------|
| 全名 | `input[name*="name"][name*="full"]` | 高 | "张三" |
| 姓名 | `input[name*="姓名"]` | 高 | "张三" |
| 名字 | `input[name*="first"]` | 中 | "三" |
| 姓氏 | `input[name*="last"]` | 中 | "张" |
| ID 选择器 | `input[id*="name"]` | 中 | "张三" |
| Placeholder | `input[placeholder*="姓名"]` | 低 | "张三" |

**备用选择器**:
```javascript
[
  'input[name*="name"]',
  'input[id*="name"]',
  'input[placeholder*="name" i]',
  'input[placeholder*="姓名"]'
]
```

### 邮箱

| 字段类型 | 选择器模式 | 优先级 | 示例值 |
|---------|-----------|--------|--------|
| Email 类型 | `input[type="email"]` | 最高 | "zhangsan@example.com" |
| Name 属性 | `input[name*="email"]` | 高 | "zhangsan@example.com" |
| Name 属性 | `input[name*="mail"]` | 高 | "zhangsan@example.com" |
| ID 选择器 | `input[id*="email"]` | 中 | "zhangsan@example.com" |
| Placeholder | `input[placeholder*="邮箱"]` | 低 | "zhangsan@example.com" |

**备用选择器**:
```javascript
[
  'input[type="email"]',
  'input[name*="email"]',
  'input[name*="mail"]',
  'input[id*="email"]',
  'input[placeholder*="email" i]',
  'input[placeholder*="邮箱"]'
]
```

### 电话

| 字段类型 | 选择器模式 | 优先级 | 示例值 |
|---------|-----------|--------|--------|
| Tel 类型 | `input[type="tel"]` | 最高 | "13800138000" |
| Phone | `input[name*="phone"]` | 高 | "13800138000" |
| Mobile | `input[name*="mobile"]` | 高 | "13800138000" |
| 电话 | `input[name*="电话"]` | 高 | "13800138000" |
| 手机 | `input[name*="手机"]` | 高 | "13800138000" |
| Placeholder | `input[placeholder*="手机"]` | 低 | "13800138000" |

**备用选择器**:
```javascript
[
  'input[type="tel"]',
  'input[name*="phone"]',
  'input[name*="mobile"]',
  'input[name*="电话"]',
  'input[name*="手机"]',
  'input[id*="phone"]',
  'input[placeholder*="phone" i]',
  'input[placeholder*="手机"]'
]
```

### 生日/日期

| 字段类型 | 选择器模式 | 优先级 | 示例值 |
|---------|-----------|--------|--------|
| Date 类型 | `input[type="date"]` | 最高 | "1990-01-01" |
| Birth | `input[name*="birth"]` | 高 | "1990-01-01" |
| Birthday | `input[name*="birthday"]` | 高 | "1990-01-01" |
| DOB | `input[name*="dob"]` | 中 | "1990-01-01" |

## 账号相关字段

### 用户名

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| Username | `input[name*="username"]` | 高 |
| User | `input[name*="user"]` | 中 |
| Login | `input[name*="login"]` | 中 |
| ID 选择器 | `input[id*="username"]` | 中 |

### 密码

| 字段类型 | 选择器模式 | 优先级 | 说明 |
|---------|-----------|--------|------|
| Password 类型 | `input[type="password"]` | 最高 | 第一个密码字段 |
| Password Name | `input[name*="password"]` | 高 | 密码字段 |
| Password ID | `input[id*="password"]` | 中 | 密码字段 |

**多个密码字段**:
```javascript
// 第一个密码字段
'input[type="password"]:first-of-type'
'input[type="password"]'

// 确认密码字段
'input[type="password"][name*="confirm"]'
'input[type="password"][name*="repeat"]'
'input[type="password"]:nth-of-type(2)'
'input[type="password"]:last-of-type'
```

### 验证码

| 字段类型 | 选择器模式 | 优先级 | 说明 |
|---------|-----------|--------|------|
| Captcha | `input[name*="captcha"]` | 高 | 验证码输入框 |
| Code | `input[name*="code"]` | 中 | 验证码输入框 |
| Verification | `input[name*="verification"]` | 中 | 验证码输入框 |

**注意**: 验证码通常需要用户手动输入，AI 应该跳过或提示用户。

## 联系信息字段

### 地址

| 字段类型 | 选择器模式 | 优先级 | 说明 |
|---------|-----------|--------|------|
| Textarea | `textarea[name*="address"]` | 高 | 多行地址 |
| Input | `input[name*="address"]` | 中 | 单行地址 |
| 地址 | `textarea[name*="地址"]` | 高 | 中文地址字段 |

### 邮编

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| Zip | `input[name*="zip"]` | 高 |
| Postal | `input[name*="postal"]` | 高 |
| Postcode | `input[name*="postcode"]` | 中 |
| 邮编 | `input[name*="邮编"]` | 高 |

### 留言/消息

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| Message | `textarea[name*="message"]` | 高 |
| Comment | `textarea[name*="comment"]` | 中 |
| 留言 | `textarea[name*="留言"]` | 高 |
| 备注 | `textarea[name*="备注"]` | 中 |

## 地址相关字段

### 国家/地区

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| Country | `select[name*="country"]` | 高 |
| Region | `select[name*="region"]` | 中 |
| 国家 | `select[name*="国家"]` | 高 |

### 省/州

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| Province | `select[name*="province"]` | 高 |
| State | `select[name*="state"]` | 高 |
| 省份 | `select[name*="省份"]` | 高 |

### 城市

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| City | `select[name*="city"]` | 高 |
| 城市 | `select[name*="城市"]` | 高 |

### 区/县

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| District | `select[name*="district"]` | 高 |
| County | `select[name*="county"]` | 中 |
| 区县 | `select[name*="区县"]` | 高 |

## 选择类字段

### 性别

| 字段类型 | 选择器模式 | 优先级 | 值 |
|---------|-----------|--------|-----|
| Radio | `input[type="radio"][name*="gender"]` | 高 | "male"/"female" |
| Select | `select[name*="gender"]` | 中 | "男"/"女" |
| 性别 | `input[name*="性别"]` | 高 | "男"/"女" |

### 同意条款

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| Agree | `input[type="checkbox"][name*="agree"]` | 高 |
| Terms | `input[type="checkbox"][name*="terms"]` | 中 |
| 同意 | `input[type="checkbox"][name*="同意"]` | 高 |

### 订阅/通知

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| Subscribe | `input[type="checkbox"][name*="subscribe"]` | 高 |
| Newsletter | `input[type="checkbox"][name*="newsletter"]` | 中 |
| 订阅 | `input[type="checkbox"][name*="订阅"]` | 高 |

## 文件上传字段

### 文件上传

| 字段类型 | 选择器模式 | 优先级 |
|---------|-----------|--------|
| File | `input[type="file"]` | 最高 |
| Upload | `input[name*="upload"]` | 中 |
| 上传 | `input[name*="上传"]` | 中 |

**注意**: 文件上传需要提供文件路径，通常需要用户指定。

## 特殊字段

### 隐藏字段

某些表单可能包含隐藏字段（`input[type="hidden"]`），这些字段通常不需要填充。

### 只读字段

某些字段可能是只读的（`input[readonly]`），这些字段不需要填充。

### 禁用字段

某些字段可能是禁用的（`input[disabled]`），这些字段无法填充。

## 字段识别优先级

### 总体优先级

1. **type 属性** (最高优先级)
   - `input[type="email"]`
   - `input[type="tel"]`
   - `input[type="password"]`
   - `input[type="date"]`

2. **name 属性** (高优先级)
   - `input[name*="email"]`
   - `input[name*="phone"]`

3. **id 属性** (中优先级)
   - `input[id*="email"]`

4. **placeholder 属性** (低优先级)
   - `input[placeholder*="邮箱"]`

5. **label 关联** (低优先级)
   - 通过 `label[for="email"]` 找到对应的 input

### 匹配策略

```javascript
function findField(fieldType, form) {
  const patterns = fieldPatterns[fieldType]
  
  for (const pattern of patterns) {
    const element = form.querySelector(pattern)
    if (element && !element.disabled && !element.readOnly) {
      return element
    }
  }
  
  return null
}
```

## 最佳实践

1. **优先使用 type 属性**: `input[type="email"]` 最可靠
2. **提供多个备用选择器**: 为关键字段提供多个备用选择器
3. **检查字段状态**: 确保字段不是 disabled 或 readonly
4. **验证字段类型**: 确保字段类型匹配（如 email 字段应该是 email 类型）
5. **处理动态字段**: 某些字段可能动态加载，需要等待

## 常见问题

### Q: 如何识别确认密码字段？

A: 通常有两个密码字段，第二个是确认密码：
- 第一个: `input[type="password"]:first-of-type`
- 第二个: `input[type="password"]:last-of-type` 或 `input[type="password"][name*="confirm"]`

### Q: 如何处理多个相同类型的字段？

A: 使用 `:nth-of-type()` 或 `:first-of-type` / `:last-of-type` 选择器：
- `input[type="password"]:first-of-type` - 第一个密码字段
- `input[type="password"]:last-of-type` - 最后一个密码字段

### Q: 如何识别必填字段？

A: 必填字段通常有 `required` 属性：
- `input[required]` - 所有必填字段
- `input[type="email"][required]` - 必填的邮箱字段

### Q: 如何处理动态加载的字段？

A: 使用 `wait` 操作等待字段出现：
```javascript
{
  action: 'wait',
  target: { selector: 'input[name="email"]' },
  params: { timeout: 3000 }
}
```
