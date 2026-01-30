<template>
  <div v-if="isVisible" :class="['chat-window', displayMode, { minimized: isMinimized }]" :style="windowStyle">
    <!-- 标题栏 -->
    <div class="chat-header" @mousedown="startDrag">
      <span class="title">AI Chat</span>
      <div class="header-actions">
        <button class="icon-btn" @click="toggleMinimize" :title="isMinimized ? '展开' : '最小化'">
          <svg v-if="!isMinimized" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="icon-btn" @click="closeWindow" title="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 聊天内容区 -->
    <div v-show="!isMinimized" class="chat-body">
      <div class="messages-container" ref="messagesContainer">
        <div v-if="streamMessages.length === 0" class="empty-state">
          <p>开始对话吧</p>
        </div>

        <!-- 消息列表 -->
        <div v-for="msg in streamMessages" :key="msg.id || msg.createdAt" :class="['message', msg.role]">
          <!-- 用户消息 -->
          <template v-if="msg.role === 'user'">
            <div class="bubble user-bubble">{{ getMessageText(msg) }}</div>
          </template>

          <!-- AI 消息 -->
          <template v-else>
            <div class="assistant-content">
              <!-- 思考过程 -->
              <div v-if="msg.think" class="think-block">
                <div class="think-header">
                  <span class="think-icon">💭</span>
                  <span class="think-label">思考过程</span>
                </div>
                <div class="think-content">{{ msg.think }}</div>
              </div>

              <template v-for="(block, index) in msg.blocks" :key="index">
                <!-- 文本块 -->
                <div v-if="block.type === 'text'" class="bubble assistant-bubble">
                  {{ block.text }}
                </div>

                <!-- 工具调用块 -->
                <div v-else-if="block.type === 'tool_use'" class="tool-block">
                  <div class="tool-header">
                    <span class="tool-icon">⚙</span>
                    <span class="tool-name">{{ block.name }}</span>
                    <span v-if="block.status === 'approved'" class="tool-badge approved">已批准</span>
                    <span v-else-if="block.status === 'rejected'" class="tool-badge rejected">已拒绝</span>
                  </div>
                  <pre class="tool-params">{{ formatToolInput(block.input) }}</pre>
                  <div v-if="block.status === 'pending' && !isLoading" class="tool-actions">
                    <button class="btn btn-approve" @click="handleToolResponse(block.id, true)">Approve</button>
                    <button class="btn btn-reject" @click="handleToolResponse(block.id, false)">Reject</button>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>

        <!-- 加载指示器 -->
        <div v-if="isLoading" class="message assistant">
          <div class="assistant-content">
            <div class="bubble assistant-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input">
        <textarea
          v-model="inputMessage"
          @keydown.enter.exact.prevent="sendMessage"
          placeholder="输入消息..."
          rows="1"
          ref="inputArea"
          :disabled="waitingForToolResponse"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isLoading || waitingForToolResponse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import type { StreamMessage, ToolUseBlock, ThinkContent } from '../utils/types'

// 扩展 StreamMessage 类型以支持 think
interface ExtendedStreamMessage extends StreamMessage {
  think?: string
}

const isVisible = ref(false)
const isMinimized = ref(false)
const displayMode = ref<'float' | 'sidebar'>('float')
const streamMessages = ref<ExtendedStreamMessage[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const currentSessionId = ref(1)

// 配置项
const currentAgentId = ref('')
const currentModel = ref('claude-3-opus')
const currentUserId = ref('default_user')

const position = ref({ x: window.innerWidth - 420, y: 100 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const messagesContainer = ref<HTMLElement>()
const inputArea = ref<HTMLTextAreaElement>()
const windowStyle = ref({})

const waitingForToolResponse = computed(() => {
  if (streamMessages.value.length === 0) return false
  const lastMsg = streamMessages.value[streamMessages.value.length - 1]
  if (lastMsg.role !== 'assistant') return false
  return lastMsg.blocks.some(
    (block) => block.type === 'tool_use' && (block as ToolUseBlock).status === 'pending'
  )
})

onMounted(async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_SETTING',
    payload: { key: 'displayMode' }
  })
  if (response.success && response.data) {
    displayMode.value = response.data
  }

  await loadMessages()

  window.addEventListener('message', (event) => {
    if (event.data.source === 'ai-chat-extension') {
      if (event.data.type === 'TOGGLE_CHAT') {
        toggleWindow()
      } else if (event.data.type === 'UPDATE_MODE') {
        displayMode.value = event.data.payload.mode
      }
    }
  })

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
})

const cleanup = () => {
  document.body.style.transform = ''
  document.body.style.transition = ''
  document.body.style.width = ''
  document.body.classList.remove('ai-chat-sidebar-open')
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

window.addEventListener('beforeunload', cleanup)

watch(displayMode, (newMode, oldMode) => {
  updateWindowStyle()
  updatePageLayout(newMode, oldMode)
})

watch(isVisible, (newVisible) => {
  if (displayMode.value === 'sidebar') {
    updatePageLayout(displayMode.value, displayMode.value, newVisible)
  }
})

const updateWindowStyle = () => {
  if (displayMode.value === 'float') {
    windowStyle.value = {
      left: `${position.value.x}px`,
      top: `${position.value.y}px`
    }
  } else {
    windowStyle.value = {}
  }
}

const updatePageLayout = (newMode: string, oldMode?: string, visible?: boolean) => {
  const shouldShift = newMode === 'sidebar' && (visible !== false ? isVisible.value : visible)
  if (shouldShift) {
    document.body.style.transform = 'translateX(-400px)'
    document.body.style.transition = 'transform 0.3s ease'
    document.body.style.width = 'calc(100% + 400px)'
    document.body.classList.add('ai-chat-sidebar-open')
  } else {
    document.body.style.transform = ''
    document.body.style.transition = 'transform 0.3s ease'
    document.body.style.width = ''
    document.body.classList.remove('ai-chat-sidebar-open')
  }
}

const toggleWindow = () => {
  isVisible.value = !isVisible.value
  if (isVisible.value) {
    isMinimized.value = false
    nextTick(() => {
      inputArea.value?.focus()
      scrollToBottom()
    })
  }
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const closeWindow = () => {
  isVisible.value = false
  if (displayMode.value === 'sidebar') {
    updatePageLayout('float')
  }
}

const loadMessages = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_MESSAGES',
    payload: { sessionId: currentSessionId.value }
  })
  if (response.success) {
    streamMessages.value = response.data.map((msg: any) => ({
      ...msg,
      blocks: msg.blocks || [{ type: 'text', text: msg.content }]
    }))
    nextTick(scrollToBottom)
  }
}

const getMessageText = (msg: StreamMessage): string => {
  const textBlocks = msg.blocks.filter((b) => b.type === 'text')
  return textBlocks.map((b) => (b as any).text).join('')
}

const formatToolInput = (input: Record<string, any>): string => {
  return JSON.stringify(input, null, 2)
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || waitingForToolResponse.value) return

  const content = inputMessage.value.trim()
  inputMessage.value = ''

  const userMessage: ExtendedStreamMessage = {
    sessionId: currentSessionId.value,
    role: 'user',
    blocks: [{ type: 'text', text: content }],
    createdAt: Date.now()
  }
  streamMessages.value.push(userMessage)
  nextTick(scrollToBottom)

  await processStreamChat(content, 'user')
}

// 流式聊天处理
const processStreamChat = async (content: string, role: 'user' | 'function', toolInfo?: { toolId: string; approved: boolean }) => {
  isLoading.value = true

  try {
    // 建立长连接
    const port = chrome.runtime.connect({ name: 'chat-stream' })

    // 创建一个新的 assistant 消息用于流式更新
    const assistantMessage: ExtendedStreamMessage = {
      sessionId: currentSessionId.value,
      role: 'assistant',
      blocks: [],
      createdAt: Date.now(),
      isComplete: false
    }
    streamMessages.value.push(assistantMessage)
    const msgIndex = streamMessages.value.length - 1

    let currentContent = ''
    let currentThink = ''
    let pendingToolCall: ToolUseBlock | null = null

    // 监听流式响应
    port.onMessage.addListener((msg) => {
      if (msg.type === 'data') {
        const data = msg.data

        // 处理文本内容
        if (data.content) {
          currentContent += data.content
          // 更新或创建文本块
          const textBlockIndex = streamMessages.value[msgIndex].blocks.findIndex(b => b.type === 'text')
          if (textBlockIndex >= 0) {
            (streamMessages.value[msgIndex].blocks[textBlockIndex] as any).text = currentContent
          } else {
            streamMessages.value[msgIndex].blocks.unshift({ type: 'text', text: currentContent })
          }
          nextTick(scrollToBottom)
        }

        // 处理思考内容
        if (data.think) {
          if (!data.think.partial) {
            currentThink = data.think.reasoning_content
            streamMessages.value[msgIndex].think = currentThink
          }
        }

        // 处理工具调用
        if (data.toolCall && !data.toolCall.partial) {
          try {
            pendingToolCall = {
              type: 'tool_use',
              id: `tool_${Date.now()}`,
              name: data.toolCall.tool_name,
              input: JSON.parse(data.toolCall.arguments || '{}'),
              status: 'pending'
            }
            streamMessages.value[msgIndex].blocks.push(pendingToolCall)
            streamMessages.value[msgIndex].isComplete = false
            nextTick(scrollToBottom)
          } catch (e) {
            console.error('解析工具参数失败:', e)
          }
        }

        // 处理统计信息
        if (data.statistic) {
          console.log('Token 使用统计:', data.statistic.token_usage)
        }
      } else if (msg.type === 'done') {
        // 流式传输完成
        if (!pendingToolCall) {
          streamMessages.value[msgIndex].isComplete = true
        }
        isLoading.value = false
        port.disconnect()
      } else if (msg.type === 'error') {
        console.error('流式响应错误:', msg.error)
        // 显示错误信息
        streamMessages.value[msgIndex].blocks.push({
          type: 'text',
          text: `错误: ${msg.error}`
        })
        isLoading.value = false
        port.disconnect()
      }
    })

    // 发送请求
    port.postMessage({
      agentId: currentAgentId.value,
      sessionId: currentSessionId.value,
      message: role === 'function' && toolInfo ? JSON.stringify(toolInfo) : content,
      model: currentModel.value,
      userId: currentUserId.value,
      role
    })

  } catch (error) {
    console.error('流式聊天失败:', error)
    isLoading.value = false
  }
}

const processChat = async (content: string, toolResponse?: { toolId: string; approved: boolean }) => {
  isLoading.value = true

  try {
    const response = await chrome.runtime.sendMessage({
      type: toolResponse ? 'TOOL_RESPONSE' : 'SEND_MESSAGE',
      payload: {
        sessionId: currentSessionId.value,
        content,
        toolResponse,
        agentId: currentAgentId.value,
        model: currentModel.value,
        userId: currentUserId.value
      }
    })

    if (response.success && response.blocks) {
      const assistantMessage: ExtendedStreamMessage = {
        sessionId: currentSessionId.value,
        role: 'assistant',
        blocks: response.blocks,
        createdAt: Date.now(),
        isComplete: response.isComplete,
        think: response.think
      }
      streamMessages.value.push(assistantMessage)
      nextTick(scrollToBottom)
    } else if (response.success && response.response) {
      const assistantMessage: ExtendedStreamMessage = {
        sessionId: currentSessionId.value,
        role: 'assistant',
        blocks: [{ type: 'text', text: response.response }],
        createdAt: Date.now(),
        isComplete: true
      }
      streamMessages.value.push(assistantMessage)
      nextTick(scrollToBottom)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleToolResponse = async (toolId: string, approved: boolean) => {
  const lastMsg = streamMessages.value[streamMessages.value.length - 1]
  if (lastMsg && lastMsg.role === 'assistant') {
    const toolBlock = lastMsg.blocks.find(
      (b) => b.type === 'tool_use' && (b as ToolUseBlock).id === toolId
    ) as ToolUseBlock | undefined

    if (toolBlock) {
      toolBlock.status = approved ? 'approved' : 'rejected'
    }
  }

  // 使用 role: 'function' 调用流式接口
  await processStreamChat('', 'function', { toolId, approved })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const startDrag = (e: MouseEvent) => {
  if (displayMode.value !== 'float') return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
  updateWindowStyle()
}

const stopDrag = () => {
  isDragging.value = false
}
</script>

<style scoped>
.chat-window {
  position: fixed;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 2147483647;
  overflow: hidden;
}

.chat-window.float {
  width: 380px;
  height: 520px;
}

.chat-window.float.minimized {
  height: 40px;
}

.chat-window.sidebar {
  right: 0;
  top: 0;
  width: 380px;
  height: 100vh;
  border-radius: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  cursor: move;
  user-select: none;
}

.title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.icon-btn:hover {
  background: #e9ecef;
}

.icon-btn svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.chat-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: #fff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #adb5bd;
  font-size: 13px;
}

.empty-state p {
  margin: 0;
}

.message {
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.bubble {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  word-wrap: break-word;
}

.user-bubble {
  background: #007bff;
  color: #fff;
  border-bottom-right-radius: 2px;
}

.assistant-bubble {
  background: #f1f3f4;
  color: #333;
  border-bottom-left-radius: 2px;
}

.assistant-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 85%;
}

/* 工具块 */
.tool-block {
  background: #fff8e6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
}

/* 思考块 */
.think-block {
  background: #f0f7ff;
  border: 1px solid #91caff;
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  margin-bottom: 6px;
}

.think-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.think-icon {
  font-size: 14px;
}

.think-label {
  font-weight: 500;
  color: #1677ff;
}

.think-content {
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tool-icon {
  color: #faad14;
}

.tool-name {
  font-weight: 500;
  color: #d48806;
}

.tool-badge {
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.tool-badge.approved {
  background: #d4edda;
  color: #155724;
}

.tool-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.tool-params {
  background: #fffbe6;
  border-radius: 4px;
  padding: 6px 8px;
  margin: 0;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  color: #614700;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

.tool-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.btn-approve {
  background: #28a745;
  color: #fff;
}

.btn-approve:hover {
  background: #218838;
}

.btn-reject {
  background: #dc3545;
  color: #fff;
}

.btn-reject:hover {
  background: #c82333;
}

/* 打字动画 */
.bubble.typing {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
}

.bubble.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #adb5bd;
  animation: typing 1.2s infinite;
}

.bubble.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.bubble.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

/* 输入区 */
.chat-input {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #e9ecef;
  background: #fff;
}

.chat-input textarea {
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 80px;
}

.chat-input textarea:focus {
  border-color: #007bff;
}

.chat-input textarea:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #007bff;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #0069d9;
}

.send-btn:disabled {
  background: #dee2e6;
  cursor: not-allowed;
}

.send-btn svg {
  width: 16px;
  height: 16px;
  stroke: #fff;
}

/* 滚动条 */
.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 2px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>
