# 元素采集策略优化总结

## 优化内容

### 1. 扩展选择器列表（从19个扩展到40+个）

#### 新增的元素类型：

**Tab页签相关：**
- `[role="tab"]` - ARIA Tab页签
- `[role="tabpanel"]` - Tab内容面板
- `[class*="tab"]` / `[class*="Tab"]` - Tab类名模式
- `[data-tab]` / `[data-role="tab"]` - Tab数据属性
- `.nav-tabs > li` - Bootstrap风格Tabs
- `.tab-list > *` / `.tab-item` - Tab列表项
- `[role="presentation"]` - Bootstrap Tabs容器

**更多列表项：**
- `li[role="tab"]` / `li[role="menuitem"]` / `li[role="button"]` - 带角色的li
- `.list-group-item` - Bootstrap列表组
- `.menu-item` / `.dropdown-item` - 菜单和下拉项

**ARIA角色组件：**
- `[role="switch"]` - 开关/切换按钮
- `[role="menuitem"]` - 菜单项
- `[role="treeitem"]` - 树形节点
- `[role="gridcell"]` / `[role="cell"]` - 表格单元格

**特殊输入类型：**
- `input[type="date"]` / `input[type="datetime-local"]` - 日期选择器
- `input[type="time"]` / `input[type="month"]` / `input[type="week"]` - 时间选择器
- `input[type="file"]` - 文件上传
- `input[type="color"]` - 颜色选择器
- `input[type="range"]` - 滑块

**其他交互元素：**
- `details` / `summary` - 详情展开组件
- `label[for]` - 关联的标签

### 2. 智能Tab页签识别

新增 `isTabElement()` 函数，通过多种方式识别Tab页签：

```typescript
function isTabElement(el: PageElement, originalEl: HTMLElement): boolean {
  // 1. 通过role判断
  if (originalEl.getAttribute('role') === 'tab') return true
  
  // 2. 通过类名判断（不区分大小写）
  if (className.includes('tab') || className.includes('Tab')) return true
  
  // 3. 通过data属性判断
  if (originalEl.hasAttribute('data-tab')) return true
  if (originalEl.getAttribute('data-role') === 'tab') return true
  
  // 4. 通过父容器判断（Bootstrap风格）
  if (parent.className.includes('nav-tabs') || parent.className.includes('tab-list')) {
    return true
  }
}
```

### 3. 优化的元素描述生成

#### 新增的类型识别：
- **Tab页签** - 显示为"Tab页签:标题(当前激活)"
- **开关按钮** - `role="switch"` 识别为"开关按钮"
- **日期选择器** - `input[type="date"]` 等识别为"日期选择器"
- **文件上传** - `input[type="file"]` 识别为"文件上传"
- **菜单项** - `role="menuitem"` 识别为"菜单项"
- **更多输入类型** - tel、number、url、color、range等

#### 特殊处理：
- **Tab页签激活状态** - 显示"当前激活"标记
- **单选/复选框选中状态** - 显示"已选中"标记
- **获取title属性** - 作为备用标识
- **Tab页签文本提取** - 从子元素获取文本内容

### 4. 更新的筛选策略

#### 新的优先级权重：
```typescript
priorities: {
  form: 10,      // 表单元素（最高）
  button: 8,     // 按钮
  tab: 7,        // Tab页签（新增，高优先级）
  menu: 6,       // 菜单项（新增）
  link: 3,       // 链接
  list: 4,       // 列表项（新增）
  text: 1        // 文本
}
```

#### 智能筛选：
- Tab页签获得高优先级（7分），确保用户说"切换到第一个标签"时能准确识别
- 列表项（li、details等）获得中等优先级（4分）

### 5. 扩展的请求更多元素参数

#### 新增的区域类型：
- `tab_panel` - Tab面板区域内
- `modal` - 弹窗/模态框内
- `menu` - 菜单区域内

#### 新增的元素类型：
- `tab` - 只获取Tab页签
- `menu` - 只获取菜单项
- `list` - 只获取列表项
- `radio` - 只获取单选框
- `checkbox` - 只获取复选框

## 使用示例

### 示例1：用户说"切换到设置标签"

```
用户指令: "切换到设置标签"

提取关键词: ["设置", "标签"]

采集的元素可能包括:
- Tab页签:首页(当前激活) - e_001
- Tab页签:设置 - e_002        ← 匹配"设置"和"标签"关键词
- Tab页签:关于 - e_003
- 按钮:保存设置 - e_004

AI识别: 应该点击 elementId: "e_002"
执行操作: {action: "click", target: {elementId: "e_002"}}
```

### 示例2：Tab页签不在当前视口

```
用户指令: "切换到第三个标签"

采集的元素（仅视口内）:
- Tab页签:首页(当前激活)
- Tab页签:产品
- 输入框:搜索
- 按钮:搜索

AI发现: 没有找到"第三个标签"
请求更多元素: request_more_elements({elementType: "tab"})

返回所有Tab页签:
- Tab页签:首页(当前激活) - e_001
- Tab页签:产品 - e_002
- Tab页签:服务 - e_003
- Tab页签:关于我们 - e_004

AI识别: 第三个是 elementId: "e_003"
```

### 示例3：在弹窗内操作

```
用户指令: "在弹窗里点击确认按钮"

请求元素: request_more_elements({region: "modal", elementType: "button"})

返回弹窗内的按钮:
- 按钮:确认 - e_101
- 按钮:取消 - e_102
- 按钮:了解更多 - e_103

AI识别: 应该点击 elementId: "e_101"
```

## 技术细节

### 元素采集流程

```
1. collectInteractiveElements()
   ├─ 使用40+个CSS选择器扫描页面
   ├─ 对每个元素调用 collectElementInfo()
   │  ├─ 检查可见性
   │  ├─ 提取基本信息（id, tag, rect等）
   │  ├─ 提取额外属性（type, placeholder等）
   │  └─ 保存到 elementMap
   └─ 返回 PageElement[]

2. filterElements()
   ├─ 从用户消息提取关键词
   ├─ 计算每个元素的相关性得分
   │  ├─ 关键词匹配: +10分
   │  ├─ 元素类型权重: form(10), button(8), tab(7)等
   │  ├─ 位置权重: visible(5), nearViewport(2)
   │  └─ 禁用降权: -5分
   ├─ 按得分排序
   └─ 取前30个

3. toCompactFormat()
   ├─ 对每个元素调用 generateElementDescription()
   │  ├─ 识别元素类型（包括Tab页签）
   │  ├─ 获取标识信息
   │  ├─ 添加额外信息（激活状态、选中状态等）
   │  └─ 生成描述字符串
   └─ 返回 CompactElement[]
```

### 性能考虑

- **Token 优化**: 精简描述格式，最多30个元素
- **可见性优先**: 视口内元素得分更高
- **分层请求**: 元素不够时按需请求特定区域
- **缓存机制**: elementMap 保存原始DOM引用

## 优势对比

| 特性 | 优化前 | 优化后 |
|------|--------|--------|
| 选择器数量 | 19个 | 40+个 |
| Tab页签识别 | ❌ 不支持 | ✅ 全面支持 |
| 特殊输入类型 | 基础类型 | 日期、文件、颜色等 |
| 元素描述 | 基础 | 包含激活/选中状态 |
| 请求参数 | 4种区域+4种类型 | 7种区域+9种类型 |
| ARIA支持 | 基础role | 全面role支持 |

## 后续优化建议

1. **智能分组**: 将相关元素（如Tab组）作为一个整体发送，减少Token
2. **上下文记忆**: 记住用户上次操作的区域，优先显示相关元素
3. **动态权重**: 根据用户历史行为调整元素优先级
4. **图片识别**: 对图标类Tab使用图片识别辅助文本识别
5. **嵌套结构**: 支持树形结构的元素层级展示

## 相关文件

- `src/content/elementCollector.ts` - 元素采集实现
- `src/utils/pageActionTypes.ts` - 类型定义
- `src/content/actionExecutor.ts` - 操作执行
- `docs/browser-dom-tools-complete.md` - 工具定义文档