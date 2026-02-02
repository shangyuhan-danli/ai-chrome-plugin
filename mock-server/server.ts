/**
 * AI Chat Extension - Mock Server (TypeScript)
 * 用于测试浏览器工具的模拟后端服务器
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 5000;

// 中间件
app.use(cors({ origin: '*' }));
app.use(express.json());

// 类型定义
interface Agent {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  avatar?: string | null;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface Session {
  id: string;
  messages: any[];
  createdAt: string;
}

interface ChatRequest {
  agentId?: string;
  sessionId?: string;
  message: string;
  userId?: string;
  role?: 'user' | 'assistant' | 'function';
  currentPageInfo?: {
    url?: string;
    title?: string;
    elements?: any[];
  };
}

// 模拟 Agent 数据
const MOCK_AGENTS: Agent[] = [
  {
    id: 'browser-assistant',
    name: '浏览器助手',
    description: '帮助你在网页上执行各种操作，如点击、输入、滚动等',
    tags: ['browser', 'automation', 'web'],
    avatar: null
  },
  {
    id: 'form-filler',
    name: '表单填写助手',
    description: '专门帮助填写网页表单，支持自动识别和填写各种输入字段',
    tags: ['form', 'input', 'automation'],
    avatar: null
  },
  {
    id: 'web-navigator',
    name: '网页导航助手',
    description: '帮助你在网页间导航，滚动页面，查找内容',
    tags: ['navigation', 'scroll', 'search'],
    avatar: null
  },
  {
    id: 'data-extractor',
    name: '数据提取助手',
    description: '帮助从网页中提取和收集数据',
    tags: ['extraction', 'data', 'scraping'],
    avatar: null
  }
];

// 浏览器工具定义
const BROWSER_TOOLS: ToolDefinition[] = [
  {
    name: 'browser_click',
    description: '在网页上点击指定元素',
    parameters: {
      type: 'object',
      properties: {
        index: {
          type: 'integer',
          description: '要点击的元素索引'
        },
        selector: {
          type: 'string',
          description: 'CSS 选择器（可选）'
        },
        description: {
          type: 'string',
          description: '元素的描述'
        }
      },
      required: ['index']
    }
  },
  {
    name: 'browser_input',
    description: '在网页输入框中输入文本',
    parameters: {
      type: 'object',
      properties: {
        index: {
          type: 'integer',
          description: '输入框元素的索引'
        },
        content: {
          type: 'string',
          description: '要输入的内容'
        },
        selector: {
          type: 'string',
          description: 'CSS 选择器（可选）'
        },
        description: {
          type: 'string',
          description: '输入框的描述'
        }
      },
      required: ['index', 'content']
    }
  },
  {
    name: 'browser_scroll',
    description: '滚动网页',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['up', 'down', 'left', 'right'],
          description: '滚动方向'
        },
        amount: {
          type: 'integer',
          description: '滚动像素数'
        }
      },
      required: ['direction']
    }
  },
  {
    name: 'browser_get_text',
    description: '获取网页上指定元素的文本内容',
    parameters: {
      type: 'object',
      properties: {
        index: {
          type: 'integer',
          description: '元素索引'
        },
        selector: {
          type: 'string',
          description: 'CSS 选择器'
        }
      },
      required: ['index']
    }
  },
  {
    name: 'browser_go_back',
    description: '返回上一页',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'browser_refresh',
    description: '刷新当前页面',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

// 会话存储
const sessions: Map<string, Session> = new Map();

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 获取 Agent 列表
app.get('/api/v1/agent/list', (req: Request, res: Response) => {
  const userId = (req.query.user_id || req.query.userId) as string || 'default_user';
  const pageUrl = (req.query.url || req.query.pageUrl) as string || '';
  const pageTitle = (req.query.title || req.query.pageTitle) as string || '';

  // 简单的意图识别逻辑
  let recommended: string | null = null;
  if (pageUrl || pageTitle) {
    const titleLower = pageTitle.toLowerCase();
    const urlLower = pageUrl.toLowerCase();
    
    if (['form', 'login', 'signup', 'register', 'input'].some(k => 
      titleLower.includes(k) || urlLower.includes(k)
    )) {
      recommended = 'form-filler';
    } else if (['search', 'list', 'catalog', 'browse'].some(k => 
      titleLower.includes(k)
    )) {
      recommended = 'web-navigator';
    } else {
      recommended = 'browser-assistant';
    }
  }

  res.json({
    success: true,
    data: {
      agents: MOCK_AGENTS,
      recommended,
      total: MOCK_AGENTS.length
    }
  });
});

// 获取工具定义
app.get('/api/v1/tools/definitions', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      tools: BROWSER_TOOLS
    }
  });
});

// 聊天接口
app.post('/api/v1/agent/chat', (req: Request, res: Response) => {
  const data: ChatRequest = req.body;
  
  // 存储会话
  const sessionId = data.sessionId || uuidv4();
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      createdAt: new Date().toISOString()
    });
  }

  const session = sessions.get(sessionId)!;
  session.messages.push({
    role: data.role || 'user',
    content: data.message,
    timestamp: new Date().toISOString()
  });

  // 检查是否是流式请求
  if (req.headers.accept === 'text/event-stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    
    streamChatResponse(res, data);
  } else {
    // 非流式响应
    res.json({
      success: true,
      data: {
        response: `收到消息: ${data.message}`,
        blocks: [{ type: 'text', text: `收到消息: ${data.message}` }],
        isComplete: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});



// 生成流式响应
function streamChatResponse(res: Response, data: ChatRequest): void {
  const message = data.message || '';
  const pageInfo = data.currentPageInfo || {};
  const messageLower = message.toLowerCase();

  // 模拟思考过程
  const thinkContent = `用户正在询问关于: ${message}
当前页面: ${pageInfo.title || '未知'}

让我分析一下应该使用什么工具...`;

  // 发送思考过程
  res.write(`data: ${JSON.stringify({ type: 'think', content: thinkContent })}\n\n`);

  // 根据消息内容决定响应
  if (['点击', 'click', '按下', 'button'].some(k => messageLower.includes(k))) {
    sendToolResponse(res, 'browser_click', {
      index: 1,
      description: '用户请求点击的按钮'
    }, [
      '我将帮您点击指定的元素。',
      '请确认是否执行此操作？'
    ]);
  } else if (['输入', '填写', 'input', 'type', 'fill'].some(k => messageLower.includes(k))) {
    sendToolResponse(res, 'browser_input', {
      index: 2,
      content: '测试输入内容',
      description: '输入框'
    }, [
      '我将帮您在输入框中填写内容。',
      '请确认是否执行？'
    ]);
  } else if (['滚动', 'scroll', '下滑', '上滑'].some(k => messageLower.includes(k))) {
    const direction = ['下', 'down'].some(k => messageLower.includes(k)) ? 'down' : 'up';
    sendToolResponse(res, 'browser_scroll', {
      direction,
      amount: 500
    }, [
      `我将帮您向${direction}滚动页面。`,
      '请确认是否执行？'
    ]);
  } else if (['获取', '提取', 'text', '内容', 'read'].some(k => messageLower.includes(k))) {
    sendToolResponse(res, 'browser_get_text', {
      index: 0,
      description: '要获取文本的元素'
    }, [
      '我将帮您获取指定元素的文本内容。',
      '请确认是否执行？'
    ]);
  } else if (['返回', 'back', '后退', '上一页'].some(k => messageLower.includes(k))) {
    sendToolResponse(res, 'browser_go_back', {}, [
      '我将帮您返回上一页。',
      '请确认是否执行？'
    ]);
  } else if (['刷新', 'refresh', 'reload', '重新加载'].some(k => messageLower.includes(k))) {
    sendToolResponse(res, 'browser_refresh', {}, [
      '我将帮您刷新当前页面。',
      '请确认是否执行？'
    ]);
  } else {
    // 普通对话响应
    const responses = [
      '我可以帮您执行各种浏览器操作。',
      '试试对我说：',
      '• "点击第一个按钮" - 测试 browser_click',
      '• "在搜索框输入内容" - 测试 browser_input',
      '• "向下滚动页面" - 测试 browser_scroll',
      '• "获取这个元素的文本" - 测试 browser_get_text',
      '• "返回上一页" - 测试 browser_go_back',
      '• "刷新页面" - 测试 browser_refresh'
    ];

    responses.forEach((part, index) => {
      setTimeout(() => {
        res.write(`data: ${JSON.stringify({ type: 'content', content: part + '\n' })}\n\n`);
        
        if (index === responses.length - 1) {
          setTimeout(() => {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();
          }, 100);
        }
      }, index * 100);
    });
    return;
  }
}

// 发送工具响应
function sendToolResponse(
  res: Response, 
  toolName: string, 
  args: Record<string, any>,
  textParts: string[]
): void {
  // 发送工具调用
  setTimeout(() => {
    res.write(`data: ${JSON.stringify({
      type: 'tool_call',
      tool_call: {
        tool_name: toolName,
        arguments: JSON.stringify(args)
      }
    })}\n\n`);

    // 发送文本说明
    textParts.forEach((part, index) => {
      setTimeout(() => {
        res.write(`data: ${JSON.stringify({ type: 'content', content: part })}\n\n`);
        
        if (index === textParts.length - 1) {
          setTimeout(() => {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();
          }, 200);
        }
      }, (index + 1) * 200);
    });
  }, 300);
}

// 获取会话信息
app.get('/api/v1/sessions/:id', (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const session = sessions.get(sessionId);
  
  if (session) {
    res.json({ success: true, data: session });
  } else {
    res.status(404).json({ success: false, error: 'Session not found' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('AI Chat Extension Mock Server (TypeScript)');
  console.log('='.repeat(60));
  console.log('\n可用端点:');
  console.log('  GET  /health                    - 健康检查');
  console.log('  GET  /api/v1/agent/list         - 获取 Agent 列表');
  console.log('  POST /api/v1/agent/chat         - 聊天接口');
  console.log('  GET  /api/v1/tools/definitions  - 工具定义');
  console.log('  GET  /api/v1/sessions/:id       - 获取会话信息');
  console.log('\n测试命令:');
  console.log('  curl http://localhost:5000/api/v1/agent/list');
  console.log("  curl -X POST http://localhost:5000/api/v1/agent/chat");
  console.log("    -H 'Content-Type: application/json'");
  console.log('    -d \'{"message": "点击按钮", "agentId": "browser-assistant"}\'');
  console.log('\n服务器启动在: http://localhost:5000');
  console.log('='.repeat(60));
});
