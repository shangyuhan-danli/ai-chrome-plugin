# 网页内容智能提取 Skill

## 📖 Skill 文档说明

### Skill 文档的作用

Skill 的 MD 文件是**给后台服务（AI）读取的指导文档**，不是直接在浏览器中执行的代码。

**执行流程**:
```
Skill MD 文件 
  ↓ (后台服务读取)
AI 理解操作方式
  ↓ (生成工具调用)
浏览器插件执行实际操作
```

### 文档中的代码示例

文档中可能包含两种类型的示例：

1. **JavaScript 代码示例**（仅用于说明逻辑）
   - 这些代码不会直接执行
   - 仅用于说明操作逻辑和流程
   - AI 需要理解这些逻辑，然后生成工具调用

2. **工具调用示例**（JSON 格式）
   - 展示 AI 应该如何调用浏览器插件的工具
   - 这些是实际会执行的调用格式
   - 例如：`page_action`、`extract_data`、`summarize_page` 等

### 浏览器插件提供的工具

浏览器插件提供了以下工具供 AI 调用：

- **`page_action`**: 执行页面操作（填充、点击、滚动、等待等）
- **`extract_data`**: 提取页面结构化数据（表格、列表、卡片等）
- **`summarize_page`**: 提取页面主要内容
- **`screenshot`**: 页面截图
- 等等...

### AI 如何使用 Skill

1. **读取 Skill 文档**: 后台服务读取 skill MD 文件
2. **理解操作方式**: AI 理解文档中描述的操作流程
3. **生成工具调用**: AI 根据 skill 指导，生成相应的工具调用
4. **执行操作**: 浏览器插件接收工具调用并执行

### 示例

**Skill 文档中可能写**:
```markdown
提取表格数据，需要：
1. 等待表格加载
2. 调用 extract_data 工具
```

**AI 理解后生成**:
```json
{
  "tool_name": "page_action",
  "arguments": {
    "actions": [
      {
        "action": "wait",
        "target": { "selector": ".data-table" },
        "params": { "timeout": 3000 }
      }
    ]
  }
}
```

然后：
```json
{
  "tool_name": "extract_data",
  "arguments": {
    "dataType": "table",
    "selector": ".data-table"
  }
}
```

**浏览器插件执行**: 实际执行这些操作

---

## 🎯 这个 Skill 的核心价值

这个 skill 展示了**浏览器环境不可替代的优势**：

- ✅ 处理需要登录的页面（自动使用浏览器Cookie）
- ✅ 处理JavaScript渲染的内容（直接访问DOM）
- ✅ 处理动态加载的内容（可以交互等待）
- ✅ 实时可视化（可以高亮、标注）

这些场景下，浏览器环境是唯一可行的方案。
