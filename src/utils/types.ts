// 消息类型定义
export interface Message {
  id?: number
  sessionId: number
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  agentId?: string
}

export interface Session {
  id?: number
  title: string
  createdAt: number
  updatedAt: number
  agentId?: string
}

export interface ChatSettings {
  displayMode: 'float' | 'sidebar'
  apiKey?: string
  apiEndpoint?: string
  model?: string
}

// Agent 定义
export interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  tags?: string[]
  matchScore?: number
}

// 消息通信类型
export type MessageType =
  | 'TOGGLE_CHAT'
  | 'SEND_MESSAGE'
  | 'GET_MESSAGES'
  | 'GET_SESSIONS'
  | 'CREATE_SESSION'
  | 'DELETE_SESSION'
  | 'SAVE_SETTING'
  | 'GET_SETTING'
  | 'UPDATE_MODE'
  // 新增: Agent 和流式会话相关
  | 'GET_AGENTS'
  | 'GET_HISTORY'
  | 'RECOGNIZE_INTENT'

export interface ChromeMessage {
  type: MessageType
  payload?: any
}
