<template>
  <div class="popup-container">
    <div class="header">
      <div class="header-content">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="header-text">
          <h2>AI Chat Assistant</h2>
          <p>智能对话助手</p>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ sessionCount }}</div>
            <div class="stat-label">会话数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ messageCount }}</div>
            <div class="stat-label">消息数</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 快捷操作 -->
      <div class="actions-section">
        <button class="action-btn primary" @click="openChat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>打开聊天窗口（内嵌）</span>
        </button>

        <button class="action-btn secondary" @click="openFullscreen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>全屏打开</span>
        </button>

        <button class="action-btn secondary" @click="openOptions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" stroke-width="2"/>
            <path d="M12 1v6m0 6v6M1 12h6m6 0h6" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>设置与管理</span>
        </button>

        <button class="action-btn secondary" @click="newSession">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>新建会话</span>
        </button>
      </div>

      <div class="divider"></div>

      <!-- 提示信息 -->
      <div class="info-section">
        <div class="info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <line x1="12" y1="16" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="8" x2="12.01" y2="8" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div class="info-text">
            <div class="info-title">使用提示</div>
            <div class="info-desc">内嵌模式：固定在页面右侧<br>全屏模式：在新标签页打开</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 底部信息 -->
      <div class="footer">
        <div class="version">v1.0.0</div>
        <a href="#" @click.prevent="openOptions" class="footer-link">帮助文档</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const sessionCount = ref(0)
const messageCount = ref(0)

onMounted(async () => {
  // 加载统计信息
  loadStats()
})

const loadStats = async () => {
  try {
    const sessionsResponse = await chrome.runtime.sendMessage({
      type: 'GET_SESSIONS'
    })
    if (sessionsResponse?.success) {
      sessionCount.value = sessionsResponse.data?.length || 0
    }

    // 获取所有消息数量
    const sessions = sessionsResponse?.data || []
    let totalMessages = 0
    for (const session of sessions) {
      const messagesResponse = await chrome.runtime.sendMessage({
        type: 'GET_MESSAGES',
        payload: { sessionId: session.id }
      })
      if (messagesResponse?.success) {
        totalMessages += messagesResponse.data?.length || 0
      }
    }
    messageCount.value = totalMessages
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const openChat = async () => {
  try {
    // 获取或创建会话
    const sessionsResponse = await chrome.runtime.sendMessage({
      type: 'GET_SESSIONS'
    })

    let sessionId = 1
    if (sessionsResponse?.success && sessionsResponse.data?.length > 0) {
      // 使用最新的会话
      sessionId = sessionsResponse.data[0].id
    } else {
      // 创建新会话
      const createResponse = await chrome.runtime.sendMessage({
        type: 'CREATE_SESSION',
        payload: { title: `新对话 ${new Date().toLocaleString('zh-CN')}` }
      })
      if (createResponse?.success) {
        sessionId = createResponse.data.id
      }
    }

    // 打开内嵌聊天窗口
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'OPEN_CHAT',
          sessionId
        })
      } catch (e) {
        // Content script未注入，先注入再发送消息
        console.log('Content script未注入，正在注入...')
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        })
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        })
        // 等待一下让content script初始化
        await new Promise(resolve => setTimeout(resolve, 100))
        await chrome.tabs.sendMessage(tab.id, {
          type: 'OPEN_CHAT',
          sessionId
        })
      }
    }
    window.close()
  } catch (error) {
    console.error('打开聊天窗口失败:', error)
    alert('打开聊天窗口失败，请刷新页面后重试')
  }
}

const openFullscreen = async () => {
  try {
    // 获取或创建会话
    const sessionsResponse = await chrome.runtime.sendMessage({
      type: 'GET_SESSIONS'
    })

    let sessionId = 1
    if (sessionsResponse?.success && sessionsResponse.data?.length > 0) {
      // 使用最新的会话
      sessionId = sessionsResponse.data[0].id
    } else {
      // 创建新会话
      const createResponse = await chrome.runtime.sendMessage({
        type: 'CREATE_SESSION',
        payload: { title: `新对话 ${new Date().toLocaleString('zh-CN')}` }
      })
      if (createResponse?.success) {
        sessionId = createResponse.data.id
      }
    }

    // 在新标签页打开
    const url = chrome.runtime.getURL(`chat.html?sessionId=${sessionId}`)
    await chrome.tabs.create({ url })
    window.close()
  } catch (error) {
    console.error('全屏打开失败:', error)
    alert('全屏打开失败，请重试')
  }
}

const openOptions = () => {
  chrome.runtime.openOptionsPage()
}

const newSession = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_SESSION',
      payload: { title: `新对话 ${new Date().toLocaleString('zh-CN')}` }
    })
    if (response?.success) {
      // 打开聊天窗口
      await openChat()
    }
  } catch (error) {
    console.error('创建会话失败:', error)
  }
}
</script>

<style scoped>
.popup-container {
  width: 380px;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  padding: 24px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo svg {
  width: 28px;
  height: 28px;
  stroke: white;
}

.header-text h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-text p {
  margin: 4px 0 0 0;
  font-size: 13px;
  opacity: 0.9;
}

.content {
  padding: 20px;
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f6f8fb 0%, #f1f3f9 100%);
  border-radius: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 20px;
  height: 20px;
  stroke: #667eea;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 16px 0;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  font-family: inherit;
}

.action-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.secondary svg {
  stroke: #667eea;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
}

.settings-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.settings-section h3 svg {
  width: 16px;
  height: 16px;
  stroke: #667eea;
}

.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-option {
  display: block;
  cursor: pointer;
}

.mode-option input[type="radio"] {
  display: none;
}

.mode-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.mode-option:hover .mode-content {
  border-color: #667eea;
  background: #f9fafb;
}

.mode-option.active .mode-content {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.mode-content svg {
  width: 24px;
  height: 24px;
  stroke: #667eea;
  flex-shrink: 0;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.mode-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version {
  font-size: 12px;
  color: #9ca3af;
}

.footer-link {
  font-size: 12px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.footer-link:hover {
  text-decoration: underline;
}

.info-section {
  margin-top: 16px;
}

.info-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.info-item svg {
  width: 20px;
  height: 20px;
  stroke: #667eea;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-text {
  flex: 1;
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.info-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}
</style>
