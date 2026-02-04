# 网站 DOM 选择器完整参考

本文档提供了目标网站所有常见操作的详细 DOM 选择器信息。

## 目录

- [搜索功能](#搜索功能)
- [登录/注册](#登录注册)
- [表单操作](#表单操作)
- [导航菜单](#导航菜单)
- [数据展示](#数据展示)
- [其他操作](#其他操作)

## 搜索功能

### 全局搜索

**URL 模式**: `/**` (所有页面)

| 元素 | 选择器 | 说明 | 备用选择器 |
|------|--------|------|-----------|
| 搜索输入框 | `input[name="q"]` | 全局搜索输入框 | `#search-input`, `.search-box input` |
| 搜索按钮 | `button[type="submit"]` | 搜索提交按钮 | `.search-btn`, `button[aria-label="搜索"]` |
| 搜索建议 | `.search-suggestions` | 搜索建议下拉列表 | `.autocomplete-list` |
| 清除按钮 | `button.clear-search` | 清除搜索内容 | `.search-clear` |

### 高级搜索

**URL 模式**: `/search/advanced`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 关键词输入框 | `input[name="keyword"]` | 关键词搜索 |
| 分类选择器 | `select[name="category"]` | 分类筛选 |
| 日期范围 | `input[name="dateFrom"]` | 开始日期 |
| 日期范围 | `input[name="dateTo"]` | 结束日期 |

## 登录/注册

### 登录页面

**URL 模式**: `/login`

| 元素 | 选择器 | 说明 | 备用选择器 |
|------|--------|------|-----------|
| 用户名输入框 | `input[name="username"]` | 用户名/邮箱 | `#username`, `input[type="text"][placeholder*="用户名"]` |
| 密码输入框 | `input[name="password"]` | 密码 | `#password`, `input[type="password"]` |
| 登录按钮 | `button[type="submit"]` | 登录提交 | `.login-btn`, `button:contains("登录")` |
| 记住我 | `input[type="checkbox"][name="remember"]` | 记住登录状态 | `#remember` |
| 忘记密码链接 | `a[href*="/forgot-password"]` | 忘记密码 | `.forgot-password-link` |
| 注册链接 | `a[href*="/register"]` | 跳转注册 | `.register-link` |

### 注册页面

**URL 模式**: `/register`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 用户名输入框 | `input[name="username"]` | 用户名 |
| 邮箱输入框 | `input[name="email"]` | 邮箱地址 |
| 密码输入框 | `input[name="password"]` | 密码 |
| 确认密码 | `input[name="confirmPassword"]` | 确认密码 |
| 验证码输入框 | `input[name="captcha"]` | 验证码 |
| 同意条款复选框 | `input[type="checkbox"][name="agree"]` | 同意服务条款 |
| 注册按钮 | `button[type="submit"]` | 提交注册 |

## 表单操作

### 通用表单字段

| 元素类型 | 选择器模式 | 说明 |
|---------|-----------|------|
| 文本输入框 | `input[type="text"][name="fieldName"]` | 文本输入 |
| 邮箱输入框 | `input[type="email"][name="email"]` | 邮箱输入 |
| 数字输入框 | `input[type="number"][name="number"]` | 数字输入 |
| 日期选择器 | `input[type="date"][name="date"]` | 日期选择 |
| 下拉选择框 | `select[name="selectName"]` | 下拉选择 |
| 多选框 | `input[type="checkbox"][name="checkboxName"]` | 多选 |
| 单选框 | `input[type="radio"][name="radioName"]` | 单选 |
| 文本域 | `textarea[name="textareaName"]` | 多行文本 |
| 文件上传 | `input[type="file"][name="file"]` | 文件上传 |
| 提交按钮 | `button[type="submit"]` | 表单提交 |
| 重置按钮 | `button[type="reset"]` | 表单重置 |
| 取消按钮 | `button[type="button"].cancel` | 取消操作 |

### 联系表单示例

**URL 模式**: `/contact`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 姓名输入框 | `input[name="name"]` | 联系人姓名 |
| 邮箱输入框 | `input[name="email"]` | 联系邮箱 |
| 主题输入框 | `input[name="subject"]` | 邮件主题 |
| 消息文本域 | `textarea[name="message"]` | 消息内容 |
| 提交按钮 | `button[type="submit"]` | 提交表单 |

## 导航菜单

### 主导航

**URL 模式**: `/**` (所有页面)

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 首页链接 | `a[href="/"]` | 返回首页 |
| 关于我们 | `a[href*="/about"]` | 关于页面 |
| 产品/服务 | `a[href*="/products"]` | 产品页面 |
| 联系我们 | `a[href*="/contact"]` | 联系页面 |
| 用户菜单 | `.user-menu` | 用户下拉菜单 |
| 登录按钮 | `a[href*="/login"]` | 登录入口 |

## 数据展示

### 列表页面

**URL 模式**: `/list` 或 `/items`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 列表容器 | `.item-list` | 列表容器 |
| 列表项 | `.item-list .item` | 单个列表项 |
| 分页器 | `.pagination` | 分页控件 |
| 下一页按钮 | `.pagination .next` | 下一页 |
| 上一页按钮 | `.pagination .prev` | 上一页 |
| 排序选择器 | `select[name="sort"]` | 排序方式 |

### 详情页面

**URL 模式**: `/item/{id}` 或 `/detail/{id}`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 标题 | `h1.item-title` | 项目标题 |
| 描述 | `.item-description` | 项目描述 |
| 价格 | `.item-price` | 价格信息 |
| 添加到购物车 | `button.add-to-cart` | 添加到购物车 |
| 立即购买 | `button.buy-now` | 立即购买 |
| 收藏按钮 | `button.favorite` | 收藏/取消收藏 |

## 其他操作

### 购物车

**URL 模式**: `/cart`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 购物车列表 | `.cart-items` | 购物车商品列表 |
| 数量输入框 | `input[name="quantity"]` | 商品数量 |
| 删除按钮 | `button.remove-item` | 删除商品 |
| 结算按钮 | `button.checkout` | 去结算 |
| 总价 | `.cart-total` | 购物车总价 |

### 用户中心

**URL 模式**: `/user` 或 `/profile`

| 元素 | 选择器 | 说明 |
|------|--------|------|
| 个人信息 | `.user-info` | 用户信息区域 |
| 编辑按钮 | `button.edit-profile` | 编辑资料 |
| 订单列表 | `.order-list` | 订单列表 |
| 设置链接 | `a[href*="/settings"]` | 设置页面 |

## 选择器优先级建议

1. **优先使用**: `name` 属性选择器（最稳定）
2. **其次使用**: `id` 选择器（如果存在且稳定）
3. **再次使用**: `aria-label` 属性（语义化，较稳定）
4. **最后使用**: `class` 选择器（可能变化）

## 常见问题

### 动态加载内容

某些网站使用 React/Vue 等框架，内容可能动态加载：

1. 使用 `wait` 操作等待元素出现
2. 设置合理的超时时间
3. 检查元素是否可见（`isVisible`）

### iframe 处理

某些表单可能在 iframe 中：

1. 使用 `switchFrame` 操作切换到对应的 frame
2. 操作完成后切换回主 frame

### 验证码处理

某些操作可能需要处理验证码：

1. 识别验证码输入框
2. 提示用户手动输入验证码
3. 或者集成验证码识别服务（如果支持）

### 元素定位失败

当选择器无法定位元素时：

1. 尝试使用备用选择器（fallback）
2. 检查元素是否在 iframe 中
3. 检查元素是否动态加载，需要等待
4. 检查页面 URL 是否匹配预期
