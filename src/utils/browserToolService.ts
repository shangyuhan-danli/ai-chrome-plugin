// 浏览器工具服务 - 管理和执行浏览器端工具
import type { PageAction, ActionResult, BatchActionResult, PageContext, RequestMoreElementsParams } from './pageActionTypes'

/**
 * 工具参数 Schema 定义 (JSON Schema 格式)
 */
export interface ToolParameterSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array'
  properties?: Record<string, {
    type: string
    description?: string
    enum?: string[]
    items?: any
  }>
  required?: string[]
  description?: string
}

/**
 * 完整的工具定义 (用于发送给后端)
 */
export interface BrowserToolDefinition {
  name: string
  description: string
  parameters: ToolParameterSchema
}

/**
 * 工具执行器接口
 */
export interface ToolExecutor {
  name: string
  description: string
  parameters: ToolParameterSchema
  execute: (args: any, tabId: number) => Promise<any>
}

/**
 * 浏览器工具服务类
 */
class BrowserToolService {
  private tools: Map<string, ToolExecutor> = new Map()

  constructor() {
    // 注册内置工具
    this.registerBuiltinTools()
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools() {
    // page_action - 执行页面操作
    this.register({
      name: 'page_action',
      description: '在用户当前浏览的网页上执行操作，如填充输入框、点击按钮、高亮文字等。可以批量执行多个操作。',
      parameters: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            description: '要执行的操作列表',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['fill', 'click', 'highlight', 'underline', 'select', 'check', 'scroll', 'read'],
                  description: '操作类型: fill(填充输入框), click(点击), highlight(高亮), underline(下划线), select(选择下拉), check(勾选), scroll(滚动), read(读取内容)'
                },
                target: {
                  type: 'object',
                  description: '目标元素',
                  properties: {
                    elementId: { type: 'string', description: '元素ID (从页面上下文获取)' },
                    selector: { type: 'string', description: 'CSS选择器 (备用)' },
                    description: { type: 'string', description: '元素描述 (用于确认)' }
                  }
                },
                params: {
                  type: 'object',
                  description: '操作参数',
                  properties: {
                    value: { type: 'string', description: '填充的值或选择的选项' },
                    color: { type: 'string', description: '高亮颜色 (如 #ffeb3b)' },
                    direction: { type: 'string', enum: ['up', 'down', 'top', 'bottom'], description: '滚动方向' }
                  }
                }
              },
              required: ['action', 'target']
            }
          }
        },
        required: ['actions']
      },
      execute: async (args: { actions: PageAction[] }, tabId: number) => {
        const actions = args.actions || [args]
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'EXECUTE_BATCH_ACTIONS',
          payload: actions
        })
        return response?.data || { success: false, error: '执行失败' }
      }
    })

    // request_more_elements - 请求更多元素
    this.register({
      name: 'request_more_elements',
      description: '当前页面元素信息不足以完成用户请求时，请求特定区域或类型的更多元素。',
      parameters: {
        type: 'object',
        properties: {
          region: {
            type: 'string',
            enum: ['form', 'header', 'sidebar', 'footer', 'below_viewport'],
            description: '页面区域: form(表单区域), header(页头), sidebar(侧边栏), footer(页脚), below_viewport(视口下方)'
          },
          elementType: {
            type: 'string',
            enum: ['input', 'button', 'link', 'select', 'all'],
            description: '元素类型: input(输入框), button(按钮), link(链接), select(下拉框), all(所有)'
          },
          keyword: {
            type: 'string',
            description: '关键词筛选，匹配元素的文本、placeholder、label等'
          }
        }
      },
      execute: async (args: RequestMoreElementsParams, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'REQUEST_MORE_ELEMENTS',
          payload: args
        })
        return { success: true, elements: response?.data || [] }
      }
    })

    // get_selected_text - 获取选中文字
    this.register({
      name: 'get_selected_text',
      description: '获取用户在页面上选中的文字，用于对选中内容进行操作。',
      parameters: {
        type: 'object',
        properties: {}
      },
      execute: async (_args: any, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'GET_SELECTED_TEXT'
        })
        return { success: true, text: response?.data || '' }
      }
    })

    // clear_ai_styles - 清除 AI 样式
    this.register({
      name: 'clear_ai_styles',
      description: '清除 AI 在页面上添加的所有高亮和下划线样式，恢复页面原始状态。',
      parameters: {
        type: 'object',
        properties: {}
      },
      execute: async (_args: any, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'CLEAR_AI_STYLES'
        })
        return { success: response?.success || false }
      }
    })
  }

  /**
   * 注册工具
   */
  register(tool: ToolExecutor) {
    this.tools.set(tool.name, tool)
  }

  /**
   * 注销工具
   */
  unregister(name: string) {
    this.tools.delete(name)
  }

  /**
   * 检查是否为浏览器工具
   */
  isBrowserTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * 获取所有工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * 获取完整的工具定义列表（用于发送给后端）
   */
  getToolDefinitions(): BrowserToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }))
  }

  /**
   * 执行工具
   */
  async execute(name: string, argsJson: string): Promise<string> {
    const tool = this.tools.get(name)
    if (!tool) {
      return JSON.stringify({ success: false, error: `未知的浏览器工具: ${name}` })
    }

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        return JSON.stringify({ success: false, error: '无法获取当前标签页' })
      }

      // 解析参数
      let args: any
      try {
        args = JSON.parse(argsJson)
      } catch (e) {
        return JSON.stringify({ success: false, error: '无效的参数格式' })
      }

      // 执行工具
      const result = await tool.execute(args, tab.id)
      return JSON.stringify(result)
    } catch (error) {
      console.error(`执行工具 ${name} 失败:`, error)
      return JSON.stringify({ success: false, error: String(error) })
    }
  }
}

// 导出单例
export const browserToolService = new BrowserToolService()
