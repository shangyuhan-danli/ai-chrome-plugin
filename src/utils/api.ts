// API 服务层 - 对接后台服务

export interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  tags?: string[]
  matchScore?: number
}

export interface ChatStreamRequest {
  agentId: string
  sessionId: string
  message: string
  context?: {
    url: string
    title: string
    selection?: string
  }
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
  baseUrl: 'http://localhost:3000'
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
   * @param url 当前页面 URL，用于意图识别和智能排序
   */
  async getAgents(url?: string): Promise<{ agents: Agent[]; recommended?: string }> {
    try {
      const params = new URLSearchParams()
      if (url) params.append('url', url)

      const response = await fetch(
        `${this.config.baseUrl}/api/agents?${params}`,
        { headers: this.getHeaders() }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || { agents: [] }
    } catch (error) {
      console.error('获取 Agent 列表失败:', error)
      // 返回空列表，让 UI 层处理
      return { agents: [] }
    }
  }

  /**
   * 流式会话
   * @param request 请求参数
   * @param onMessage 收到消息片段时的回调
   * @param onDone 完成时的回调
   * @param onError 错误时的回调
   */
  async chatStream(
    request: ChatStreamRequest,
    onMessage: (content: string) => void,
    onDone: (messageId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat/stream`, {
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
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content') {
                onMessage(data.content)
              } else if (data.type === 'done') {
                onDone(data.messageId || '')
              } else if (data.type === 'error') {
                onError(new Error(data.message || '服务端错误'))
              }
            } catch (e) {
              // JSON 解析失败，忽略这一行
              console.warn('解析 SSE 数据失败:', line)
            }
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6))
          if (data.type === 'content') {
            onMessage(data.content)
          } else if (data.type === 'done') {
            onDone(data.messageId || '')
          }
        } catch (e) {
          // 忽略
        }
      }
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
