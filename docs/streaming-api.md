# 实时会话接口文档

## 请求参数

```json
{
  "message": "用户输入的消息内容",
  "role": "user",
  "model": "claude-3-opus",
  "agent_id": "agent_001",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_123"
}
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户输入的消息内容 |
| role | string | 是 | 角色类型，可选值：`user`（普通消息）、`function`（工具调用结果） |
| model | string | 是 | 模型名称 |
| agent_id | string | 是 | Agent ID |
| session_id | string | 是 | 会话ID，使用UUID生成 |
| user_id | string | 是 | 用户ID |

### role 使用说明

- `user`: 普通用户消息，首次发送或正常对话时使用
- `function`: 当收到 tool_call 后，用户点击 approve 按钮确认执行后，再次调用接口时使用

### 工具响应请求示例（role: function）

```json
{
  "message": "{\"tool_id\":\"tool_1706500000000\",\"approved\":true,\"result\":\"\"}",
  "role": "function",
  "model": "claude-3-opus",
  "agent_id": "agent_001",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_123"
}
```

## 返回结果（流式）

### 标准消息格式

```json
{
  "role": "assistant",
  "content": "这是AI的回复内容",
  "think": {
    "reasoning_content": "这是思考过程的内容",
    "partial": false
  },
  "tool_call": {
    "partial": false,
    "tool_name": "search_web",
    "arguments": "{\"query\": \"天气预报\"}"
  },
  "statistic": {
    "token_usage": {
      "total_tokens": 150,
      "prompt_tokens": 50,
      "completion_tokens": 100
    }
  }
}
```

### 流式响应示例

以下是一个完整的流式响应过程示例：

```json
// 第1条：思考过程（部分）
{"role":"assistant","think":{"reasoning_content":"让我分析一下用户的","partial":true}}

// 第2条：思考过程（完整）
{"role":"assistant","think":{"reasoning_content":"让我分析一下用户的问题，需要搜索相关信息","partial":false}}

// 第3条：文本内容（流式）
{"role":"assistant","content":"我来帮您"}

// 第4条：文本内容（继续）
{"role":"assistant","content":"查询天气信息"}

// 第5条：工具调用（部分）
{"role":"assistant","tool_call":{"partial":true,"tool_name":"search_web","arguments":"{\"query\":"}}

// 第6条：工具调用（完整）
{"role":"assistant","tool_call":{"partial":false,"tool_name":"search_web","arguments":"{\"query\":\"北京天气\"}"}}

// 第7条：统计信息
{"role":"assistant","statistic":{"token_usage":{"total_tokens":150,"prompt_tokens":50,"completion_tokens":100}}}

// 最后一条：结束消息
{"message":"对话完成"}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| role | string | 角色，通常为 `assistant` |
| content | string | AI回复的文本内容 |
| think | object | 思考过程（可选） |
| think.reasoning_content | string | 思考内容 |
| think.partial | boolean | `true` 表示内容不完整，`false` 表示完整 |
| tool_call | object | 工具调用信息（可选） |
| tool_call.partial | boolean | `true` 表示内容不完整，`false` 表示完整 |
| tool_call.tool_name | string | 工具名称 |
| tool_call.arguments | string | 工具参数（JSON字符串） |
| statistic | object | 统计信息（可选） |
| statistic.token_usage | object | Token使用统计 |
| statistic.token_usage.total_tokens | number | 总Token数 |
| statistic.token_usage.prompt_tokens | number | 提示Token数 |
| statistic.token_usage.completion_tokens | number | 完成Token数 |

### 结束消息格式

流式传输的最后一条消息结构不同：

```json
{
  "message": "对话完成"
}
```

## 流式响应处理注意事项

1. 中间过程可能收到非标准JSON，需要跳过处理
2. 通过 `partial` 字段判断当前内容是否完整
3. 最后一条消息只有 `message` 字段，值为 "对话完成"
4. `content` 字段是增量返回的，需要累加拼接

## 调用流程

```
1. 用户发送消息 (role: "user")
   ↓
2. 接收流式响应
   - 处理 think（思考过程）
   - 处理 content（文本内容，增量累加）
   - 处理 tool_call（工具调用）
   - 处理 statistic（统计信息）
   ↓
3. 如果收到 tool_call（partial: false）:
   - 显示工具调用信息
   - 等待用户点击 approve/reject 按钮
   - 用户确认后，发送新请求 (role: "function")
   ↓
4. 继续接收响应直到收到结束消息 {"message": "对话完成"}
```

## 前端实现要点

1. **建立长连接**：使用 `chrome.runtime.connect` 建立长连接进行流式通信
2. **增量更新**：`content` 需要累加，`think` 和 `tool_call` 在 `partial: false` 时才是完整数据
3. **工具响应**：用户点击 approve 后，使用 `role: "function"` 发送工具执行结果
4. **错误处理**：跳过非标准 JSON，避免解析错误中断流式处理
