// 消息类型定义
export interface Message {
  id?: number
  sessionId: number
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  agentId?: string
}

// 流式API请求参数
export interface StreamChatRequest {
  message: string
  role: 'user' | 'function'
  model: string
  agent_id: string
  session_id: string
  user_id: string
}

// 流式API响应 - 思考内容
export interface ThinkContent {
  reasoning_content: string
}

// 流式API响应 - 工具调用
export interface ToolCallContent {
  tool_name: string
  arguments: string
}

// 流式API响应 - Token统计
export interface TokenUsage {
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
}

export interface Statistic {
  token_usage: TokenUsage
}

// 流式API响应 - 任务完成答案
export interface AnswerContent {
  result: string
}

// 流式API响应 - 向用户提问
export interface AskContent {
  question: string
}

// 流式API响应 - 标准消息
export interface StreamResponse {
  role?: string
  content?: string
  think?: ThinkContent
  tool_call?: ToolCallContent
  answer?: AnswerContent
  ask?: AskContent
  statistic?: Statistic
  // 结束消息
  message?: string
  session_id?: string
}

// 流式输出内容块类型
export type ContentBlockType = 'text' | 'tool_use' | 'tool_result' | 'summary' | 'question'

// 文本内容块
export interface TextBlock {
  type: 'text'
  text: string
}

// 工具调用内容块
export interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, any>
  status?: 'pending' | 'approved' | 'rejected'
}

// 总结内容块
export interface SummaryBlock {
  type: 'summary'
  text: string
}

// 提问内容块
export interface QuestionBlock {
  type: 'question'
  text: string
}

// 工具执行结果内容块
export interface ToolResultBlock {
  type: 'tool_result'
  toolName: string
  success: boolean
  result: string
  isLoading?: boolean
}

// 内容块联合类型
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | SummaryBlock | QuestionBlock

// 流式消息（包含多个内容块）
export interface StreamMessage {
  id?: number
  sessionId: number
  role: 'user' | 'assistant'
  blocks: ContentBlock[]
  createdAt: number
  isComplete?: boolean
  agentId?: string
}

export interface Session {
  id?: number
  title: string
  tabId?: number
  pageUrl?: string
  pageTitle?: string
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
  | 'GET_SESSION'
  | 'GET_SESSION_BY_TAB'
  | 'UPDATE_SESSION'
  | 'DELETE_SESSION'
  | 'RENAME_SESSION'
  | 'EXPORT_SESSION'
  | 'EXPORT_ALL_SESSIONS'
  | 'GET_RETENTION_DAYS'
  | 'SET_RETENTION_DAYS'
  | 'CLEAN_EXPIRED_SESSIONS'
  | 'SAVE_SETTING'
  | 'GET_SETTING'
  | 'UPDATE_MODE'
  // 新增: Agent 和流式会话相关
  | 'GET_AGENTS'
  | 'GET_HISTORY'
  | 'RECOGNIZE_INTENT'
  // 工具确认相关
  | 'TOOL_RESPONSE'
  // 页面操作相关
  | 'GET_PAGE_CONTEXT'
  | 'REQUEST_MORE_ELEMENTS'
  | 'EXECUTE_PAGE_ACTION'
  | 'EXECUTE_BATCH_ACTIONS'
  | 'CLEAR_AI_STYLES'
  | 'GET_SELECTED_TEXT'
  // 截图相关
  | 'CAPTURE_VISIBLE_TAB'

export interface ChromeMessage {
  type: MessageType
  payload?: any
}
