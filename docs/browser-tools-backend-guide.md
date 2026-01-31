# 浏览器工具后端集成指南

## 一、概述

浏览器插件会在每次聊天请求中动态传递其支持的工具定义（`browser_tools`），后端需要将这些工具注入到 Agent 的系统提示词中，使 AI 能够在合适的时机调用这些工具来操作网页。

## 二、请求格式

### 2.1 Chat API 请求结构

```python
# POST /api/v1/agent/chat
{
    "message": "帮我在搜索框输入 iPhone 16 然后点击搜索",
    "role": "user",  # 或 "function"
    "model": "claude-3-opus",
    "agent_id": "agent_xxx",
    "session_id": "uuid-xxx",
    "user_id": "user_xxx",
    "current_page_info": {
        "url": "https://www.taobao.com",
        "title": "淘宝网 - 首页",
        "elements": [
            {"id": "e_1706789012_abc123", "desc": "输入框:搜索(placeholder:搜索)"},
            {"id": "e_1706789012_def456", "desc": "按钮:搜索"},
            {"id": "e_1706789012_ghi789", "desc": "链接:登录"}
        ],
        "selectedText": ""  # 用户选中的文字（可选）
    },
    "browser_tools": [
        # 工具定义列表，见下文
    ]
}
```

### 2.2 browser_tools 完整结构

```python
browser_tools = [
    {
        "name": "page_action",
        "description": "在用户当前浏览的网页上执行操作，如填充输入框、点击按钮、高亮文字等。可以批量执行多个操作。",
        "parameters": {
            "type": "object",
            "properties": {
                "actions": {
                    "type": "array",
                    "description": "要执行的操作列表",
                    "items": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["fill", "click", "highlight", "underline", "select", "check", "scroll", "read"],
                                "description": "操作类型: fill(填充输入框), click(点击), highlight(高亮), underline(下划线), select(选择下拉), check(勾选), scroll(滚动), read(读取内容)"
                            },
                            "target": {
                                "type": "object",
                                "description": "目标元素",
                                "properties": {
                                    "elementId": {"type": "string", "description": "元素ID (从页面上下文获取)"},
                                    "selector": {"type": "string", "description": "CSS选择器 (备用)"},
                                    "description": {"type": "string", "description": "元素描述 (用于确认)"}
                                }
                            },
                            "params": {
                                "type": "object",
                                "description": "操作参数",
                                "properties": {
                                    "value": {"type": "string", "description": "填充的值或选择的选项"},
                                    "color": {"type": "string", "description": "高亮颜色 (如 #ffeb3b)"},
                                    "direction": {"type": "string", "enum": ["up", "down", "top", "bottom"], "description": "滚动方向"}
                                }
                            }
                        },
                        "required": ["action", "target"]
                    }
                }
            },
            "required": ["actions"]
        }
    },
    {
        "name": "request_more_elements",
        "description": "当前页面元素信息不足以完成用户请求时，请求特定区域或类型的更多元素。",
        "parameters": {
            "type": "object",
            "properties": {
                "region": {
                    "type": "string",
                    "enum": ["form", "header", "sidebar", "footer", "below_viewport"],
                    "description": "页面区域: form(表单区域), header(页头), sidebar(侧边栏), footer(页脚), below_viewport(视口下方)"
                },
                "elementType": {
                    "type": "string",
                    "enum": ["input", "button", "link", "select", "all"],
                    "description": "元素类型: input(输入框), button(按钮), link(链接), select(下拉框), all(所有)"
                },
                "keyword": {
                    "type": "string",
                    "description": "关键词筛选，匹配元素的文本、placeholder、label等"
                }
            }
        }
    },
    {
        "name": "get_selected_text",
        "description": "获取用户在页面上选中的文字，用于对选中内容进行操作。",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "clear_ai_styles",
        "description": "清除 AI 在页面上添加的所有高亮和下划线样式，恢复页面原始状态。",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]
```

## 三、后端处理逻辑

### 3.1 工具注入到系统提示词

```python
import json
from typing import List, Dict, Any, Optional


def generate_tools_prompt(browser_tools: List[Dict[str, Any]]) -> str:
    """
    根据浏览器工具定义生成提示词片段
    """
    if not browser_tools:
        return ""

    prompt = """

## 浏览器操作工具

你可以使用以下工具来操作用户当前浏览的网页。当用户请求涉及网页操作时（如填写表单、点击按钮、高亮文字等），请使用这些工具。

### 可用工具列表

"""

    for tool in browser_tools:
        prompt += f"#### {tool['name']}\n"
        prompt += f"**描述**: {tool['description']}\n"
        prompt += f"**参数 Schema**:\n```json\n{json.dumps(tool['parameters'], ensure_ascii=False, indent=2)}\n```\n\n"

    prompt += """
### 使用说明

1. **优先使用 elementId**: 从 `current_page_info.elements` 中获取元素 ID，这是最可靠的定位方式
2. **批量操作**: 可以在一次 `page_action` 调用中执行多个操作，按顺序执行
3. **信息不足时**: 如果页面元素信息不足以完成任务，使用 `request_more_elements` 请求更多元素
4. **操作确认**: 在执行敏感操作前，先向用户确认

### 工具调用格式

使用 tool_call 格式返回工具调用：
```json
{
    "tool_name": "page_action",
    "arguments": {
        "actions": [
            {
                "action": "fill",
                "target": {"elementId": "e_xxx"},
                "params": {"value": "要填充的内容"}
            }
        ]
    }
}
```
"""

    return prompt


def generate_page_context_prompt(page_info: Optional[Dict[str, Any]]) -> str:
    """
    根据页面上下文生成提示词片段
    """
    if not page_info:
        return ""

    prompt = f"""

## 当前页面信息

- **URL**: {page_info.get('url', '未知')}
- **标题**: {page_info.get('title', '未知')}

### 可交互元素列表

"""

    elements = page_info.get('elements', [])
    if elements:
        for el in elements:
            prompt += f"- `{el['id']}`: {el['desc']}\n"
    else:
        prompt += "（暂无可交互元素信息）\n"

    selected_text = page_info.get('selectedText')
    if selected_text:
        prompt += f"\n### 用户选中的文字\n\n{selected_text}\n"

    return prompt


def inject_browser_context(
    system_prompt: str,
    page_info: Optional[Dict[str, Any]] = None,
    browser_tools: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    将浏览器上下文注入到系统提示词中

    Args:
        system_prompt: 原始系统提示词
        page_info: 页面上下文信息 (current_page_info)
        browser_tools: 浏览器工具定义列表

    Returns:
        注入后的系统提示词
    """
    # 注入工具定义
    tools_prompt = generate_tools_prompt(browser_tools)

    # 注入页面上下文
    page_prompt = generate_page_context_prompt(page_info)

    return system_prompt + tools_prompt + page_prompt
```

### 3.2 处理工具调用响应

当 AI 返回工具调用时，需要以特定格式返回给前端：

```python
from dataclasses import dataclass
from typing import Optional
import json


@dataclass
class ToolCall:
    tool_name: str
    arguments: str  # JSON 字符串


def format_tool_call_response(tool_name: str, arguments: dict) -> dict:
    """
    格式化工具调用响应
    """
    return {
        "tool_call": {
            "tool_name": tool_name,
            "arguments": json.dumps(arguments, ensure_ascii=False)
        }
    }


# 示例：AI 决定执行页面操作
def handle_ai_response(ai_output: str) -> dict:
    """
    处理 AI 输出，提取工具调用
    """
    # 解析 AI 输出中的工具调用
    # 这里的实现取决于你使用的 AI 模型和输出格式

    # 假设 AI 输出了工具调用
    tool_call = {
        "tool_name": "page_action",
        "arguments": {
            "actions": [
                {
                    "action": "fill",
                    "target": {"elementId": "e_1706789012_abc123"},
                    "params": {"value": "iPhone 16"}
                },
                {
                    "action": "click",
                    "target": {"elementId": "e_1706789012_def456"}
                }
            ]
        }
    }

    return format_tool_call_response(
        tool_call["tool_name"],
        tool_call["arguments"]
    )
```

### 3.3 处理工具执行结果

前端执行工具后会将结果作为 `role: "function"` 的消息发回：

```python
def handle_tool_result(message: str) -> dict:
    """
    处理工具执行结果

    前端发送的 message 格式:
    {
        "tool_id": "tool_xxx",
        "result": "{\"success\": true, \"results\": [...], \"summary\": \"执行了 2 个操作，成功 2 个\"}"
    }
    """
    data = json.loads(message)
    tool_id = data.get("tool_id")
    result = json.loads(data.get("result", "{}"))

    # 将结果添加到对话上下文中
    context_message = f"工具执行结果: {result.get('summary', '未知')}"

    if not result.get("success"):
        context_message = f"工具执行失败: {result.get('error', '未知错误')}"

    return {
        "role": "function",
        "content": context_message,
        "tool_id": tool_id
    }
```

## 四、完整示例

### 4.1 FastAPI 路由示例

```python
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    role: str = "user"
    model: str = "claude-3-opus"
    agent_id: str
    session_id: str
    user_id: str
    current_page_info: Optional[Dict[str, Any]] = None
    browser_tools: Optional[List[Dict[str, Any]]] = None


@router.post("/api/v1/agent/chat")
async def chat(request: ChatRequest):
    """
    流式聊天接口
    """
    async def generate():
        # 1. 获取 Agent 的基础系统提示词
        base_system_prompt = await get_agent_system_prompt(request.agent_id)

        # 2. 注入浏览器上下文
        system_prompt = inject_browser_context(
            base_system_prompt,
            page_info=request.current_page_info,
            browser_tools=request.browser_tools
        )

        # 3. 调用 AI 模型
        async for chunk in call_ai_model(
            system_prompt=system_prompt,
            message=request.message,
            role=request.role,
            model=request.model,
            session_id=request.session_id
        ):
            # 4. 返回 SSE 格式的响应
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

        # 5. 发送完成消息
        yield f"data: {json.dumps({'message': '对话完成'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


async def get_agent_system_prompt(agent_id: str) -> str:
    """
    获取 Agent 的基础系统提示词
    """
    # 从数据库或配置中获取
    return "你是一个智能助手，可以帮助用户完成各种任务。"


async def call_ai_model(
    system_prompt: str,
    message: str,
    role: str,
    model: str,
    session_id: str
):
    """
    调用 AI 模型（示例）
    """
    # 这里实现具体的 AI 调用逻辑
    # 返回流式响应

    # 示例：返回文本内容
    yield {"content": "好的，我来帮你"}
    await asyncio.sleep(0.1)
    yield {"content": "操作网页。"}

    # 示例：返回工具调用
    yield {
        "tool_call": {
            "tool_name": "page_action",
            "arguments": json.dumps({
                "actions": [
                    {
                        "action": "fill",
                        "target": {"elementId": "e_xxx"},
                        "params": {"value": "iPhone 16"}
                    }
                ]
            }, ensure_ascii=False)
        }
    }
```

## 五、注意事项

1. **兼容性处理**: 如果 `browser_tools` 为空或不存在，不要注入工具相关的提示词
2. **Token 优化**: 页面元素列表可能很长，前端已经做了智能筛选（最多 30 个），但仍需注意 Token 消耗
3. **安全考虑**:
   - 不要在日志中记录敏感的页面信息
   - 对于密码框等敏感元素，前端不会传递 value 值
4. **错误处理**: 工具执行可能失败，需要优雅处理并告知用户

## 六、工具执行结果格式

前端执行工具后返回的结果格式：

```python
# 成功
{
    "success": True,
    "results": [
        {"success": True, "message": "已填充: iPhone 16"},
        {"success": True, "message": "已点击: 搜索按钮"}
    ],
    "summary": "执行了 2 个操作，成功 2 个，失败 0 个"
}

# 失败
{
    "success": False,
    "error": "未找到目标元素"
}

# request_more_elements 结果
{
    "success": True,
    "elements": [
        {"id": "e_xxx", "desc": "按钮:提交"},
        {"id": "e_yyy", "desc": "按钮:取消"}
    ]
}
```
