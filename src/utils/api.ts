// API 服务层 - 对接后台服务
import type { StreamResponse, ThinkContent, ToolCallContent, Statistic } from './types'
import type { PageContext } from './pageActionTypes'
import type { BrowserToolDefinition } from './browserToolService'

export interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  tags?: string[]
  matchScore?: number
}

export interface ChatStreamRequest {
  message: string
  role: 'user' | 'function'
  model: string
  agent_id: string
  session_id: string
  user_id: string
  current_page_info?: PageContext           // 当前页面信息
  browser_tools?: BrowserToolDefinition[]   // 浏览器支持的工具列表
}

// 流式响应回调数据
export interface StreamCallbackData {
  content?: string
  think?: ThinkContent
  toolCall?: ToolCallContent
  statistic?: Statistic
}

export interface HistoryMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  agentId?: string
}

export interface ApiConfig {
  baseUrl: string
  token?: string
}

// 默认配置 - 开发环境
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'http://localhost:5001'
}

export class ApiService {
  private config: ApiConfig

  constructor(config: ApiConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  // 更新配置
  updateConfig(config: Partial<ApiConfig>) {
    this.config = { ...this.config, ...config }
  }

  setToken(token: string) {
    this.config.token = token
  }

  setBaseUrl(baseUrl: string) {
    this.config.baseUrl = baseUrl
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`
    }
    return headers
  }

  /**
   * 获取 Agent 列表
   * @param userId 用户ID（必选）
   * @param tags 标签过滤（可选）
   */
  async getAgents(userId: string, tags?: string): Promise<{ agents: Agent[]; recommended?: string }> {
    try {
      const params = new URLSearchParams()
      params.append('user_id', userId)
      if (tags) params.append('tags', tags)

      const response = await fetch(
        `${this.config.baseUrl}/api/v1/agent/list?${params}`,
        { headers: this.getHeaders() }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const rawAgents = result.data || result || []

      // 映射后台字段到前端字段
      const agents: Agent[] = rawAgents.map((item: any) => ({
        id: item.agent_id || item.id,
        name: item.agent_name || item.name,
        description: item.agent_description || item.description || '',
        avatar: item.avatar,
        tags: item.tags,
        matchScore: item.match_score || item.matchScore
      }))

      return { agents, recommended: result.recommended }
    } catch (error) {
      console.error('获取 Agent 列表失败:', error)
      // 返回空列表，让 UI 层处理
      return { agents: [] }
    }
  }

  /**
   * 流式会话
   * @param request 请求参数
   * @param onData 收到数据时的回调
   * @param onDone 完成时的回调
   * @param onError 错误时的回调
   */
  async chatStream(
    request: ChatStreamRequest,
    onData: (data: StreamCallbackData) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/agent/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法获取响应流')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // 保留最后一个可能不完整的行
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          // 跳过 SSE 事件行 (event:xxx)
          if (trimmedLine.startsWith('event:')) {
            continue
          }

          // 处理 SSE 数据行 (data:xxx)
          let jsonStr = trimmedLine
          if (trimmedLine.startsWith('data:')) {
            jsonStr = trimmedLine.slice(5).trim()
          }

          // 跳过空数据
          if (!jsonStr) continue

          try {
            const data: StreamResponse = JSON.parse(jsonStr)

            // 检查是否是结束消息
            if (data.message === '对话完成') {
              onDone()
              return
            }

            // 构建回调数据
            const callbackData: StreamCallbackData = {}

            if (data.content) {
              callbackData.content = data.content
            }
            if (data.think) {
              callbackData.think = data.think
            }
            if (data.tool_call) {
              callbackData.toolCall = data.tool_call
            }
            if (data.statistic) {
              callbackData.statistic = data.statistic
            }

            // 只有有数据时才回调
            if (Object.keys(callbackData).length > 0) {
              onData(callbackData)
            }
          } catch (e) {
            // JSON 解析失败，跳过非标准JSON
            console.warn('解析流式数据失败，跳过:', jsonStr)
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer.trim()) {
        let jsonStr = buffer.trim()
        // 处理 SSE 格式
        if (jsonStr.startsWith('event:')) {
          // 跳过事件行，尝试找数据行
          const dataMatch = jsonStr.match(/data:(.+)/)
          if (dataMatch) {
            jsonStr = dataMatch[1].trim()
          } else {
            jsonStr = ''
          }
        } else if (jsonStr.startsWith('data:')) {
          jsonStr = jsonStr.slice(5).trim()
        }

        if (jsonStr) {
          try {
            const data: StreamResponse = JSON.parse(jsonStr)
            if (data.message === '对话完成') {
              onDone()
              return
            }

            const callbackData: StreamCallbackData = {}
            if (data.content) callbackData.content = data.content
            if (data.think) callbackData.think = data.think
            if (data.tool_call) callbackData.toolCall = data.tool_call
            if (data.statistic) callbackData.statistic = data.statistic

            if (Object.keys(callbackData).length > 0) {
              onData(callbackData)
            }
          } catch (e) {
            // 忽略
          }
        }
      }

      onDone()
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * 获取会话历史
   */
  async getHistory(
    sessionId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ messages: HistoryMessage[]; total: number; hasMore: boolean }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/sessions/${sessionId}/history?page=${page}&pageSize=${pageSize}`,
        { headers: this.getHeaders() }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || { messages: [], total: 0, hasMore: false }
    } catch (error) {
      console.error('获取会话历史失败:', error)
      return { messages: [], total: 0, hasMore: false }
    }
  }

  /**
   * 意图识别 - 根据 URL 获取推荐的 Agent
   */
  async recognizeIntent(url: string): Promise<{ agentId: string; confidence: number } | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/intent/recognize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        return null
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('意图识别失败:', error)
      return null
    }
  }
}

// 导出单例
export const apiService = new ApiService()
