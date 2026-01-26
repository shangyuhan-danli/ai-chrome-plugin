// 消息类型定义
export interface Message {
  id?: number
  sessionId: number
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export interface Session {
  id?: number
  title: string
  createdAt: number
  updatedAt: number
}

export interface ChatSettings {
  displayMode: 'float' | 'sidebar'
  apiKey?: string
  apiEndpoint?: string
  model?: string
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

export interface ChromeMessage {
  type: MessageType
  payload?: any
}
