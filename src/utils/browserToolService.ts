// 浏览器工具服务 - 管理和执行浏览器端工具
import type { PageAction, ActionResult, BatchActionResult, PageContext, RequestMoreElementsParams } from './pageActionTypes'

/**
 * 工具执行器接口
 */
export interface ToolExecutor {
  name: string
  description: string
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
      description: '在用户当前浏览的网页上执行操作，如填充输入框、点击按钮、高亮文字等',
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
      description: '当前页面元素信息不足时，请求特定区域或类型的更多元素',
      execute: async (args: RequestMoreElementsParams, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'REQUEST_MORE_ELEMENTS',
          payload: args
        })
        return { success: true, elements: response?.data || [] }
      }
    })

    // get_page_elements - 获取页面元素
    this.register({
      name: 'get_page_elements',
      description: '获取当前页面的可交互元素列表',
      execute: async (args: { userMessage?: string }, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'GET_PAGE_CONTEXT',
          payload: { userMessage: args.userMessage || '' }
        })
        return response?.data || null
      }
    })

    // execute_action - 执行单个操作
    this.register({
      name: 'execute_action',
      description: '执行单个页面操作',
      execute: async (args: PageAction, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'EXECUTE_PAGE_ACTION',
          payload: args
        })
        return response?.data || { success: false, error: '执行失败' }
      }
    })

    // get_selected_text - 获取选中文字
    this.register({
      name: 'get_selected_text',
      description: '获取用户在页面上选中的文字',
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
      description: '清除 AI 在页面上添加的所有高亮和下划线样式',
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
   * 获取工具定义（用于发送给后端）
   */
  getToolDefinitions(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description
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
