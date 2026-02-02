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
const openChat = async () => {
  try {
    // 打开内嵌聊天窗口 - 让 content script 自动处理会话
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'OPEN_CHAT'
          // 不传 sessionId，让 content script 自动获取或创建
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
          type: 'OPEN_CHAT'
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
    // 获取当前标签页信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const tabId = tab?.id
    const pageUrl = tab?.url || ''
    const pageTitle = tab?.title || '新对话'

    // 检查该标签页是否已有会话
    let sessionId: number
    if (tabId) {
      const existingSession = await chrome.runtime.sendMessage({
        type: 'GET_SESSION_BY_TAB',
        payload: { tabId }
      })

      if (existingSession.success && existingSession.data) {
        sessionId = existingSession.data.id
      } else {
        // 创建新会话
        const createResponse = await chrome.runtime.sendMessage({
          type: 'CREATE_SESSION',
          payload: {
            title: pageTitle,
            tabId,
            pageUrl,
            pageTitle
          }
        })
        sessionId = createResponse.data.id
      }
    } else {
      // 无法获取 tabId，创建普通会话
      const createResponse = await chrome.runtime.sendMessage({
        type: 'CREATE_SESSION',
        payload: {
          title: pageTitle,
          pageUrl,
          pageTitle
        }
      })
      sessionId = createResponse.data.id
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
</script>

<style scoped>

.popup-container {
  width: 380px;
  background: var(--bg-primary);
  font-family: var(--font-sans);
}

.header {
  padding: 24px 20px;
  background: var(--gradient-primary);
  color: var(--text-inverse);
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
  font-size: var(--text-xl);
  font-weight: 600;
}

.header-text p {
  margin: var(--space-1) 0 0 0;
  font-size: var(--text-base);
  opacity: 0.9;
}

.content {
  padding: var(--space-5);
}

.divider {
  height: 1px;
  background: var(--border-primary);
  margin: var(--space-4) 0;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: var(--text-md);
  font-weight: 500;
  transition: all var(--transition-base);
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.action-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.action-btn.primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}

.action-btn.primary:active {
  transform: translateY(0);
}

.action-btn.secondary {
  background: var(--surface-secondary);
  color: var(--text-secondary);
}

.action-btn.secondary svg {
  stroke: var(--primary-500);
}

.action-btn.secondary:hover {
  background: var(--bg-hover);
  border-color: var(--primary-500);
}

.settings-section h3 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-md);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3) 0;
  font-weight: 600;
}

.settings-section h3 svg {
  width: 16px;
  height: 16px;
  stroke: var(--primary-500);
}

.mode-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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
  gap: var(--space-3);
  padding: var(--space-3);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.mode-option:hover .mode-content {
  border-color: var(--primary-500);
  background: var(--bg-hover);
}

.mode-option.active .mode-content {
  border-color: var(--primary-500);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.mode-content svg {
  width: 24px;
  height: 24px;
  stroke: var(--primary-500);
  flex-shrink: 0;
}

.mode-title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}

.mode-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.footer-link {
  font-size: var(--text-sm);
  color: var(--primary-500);
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-base);
}

.footer-link:hover {
  text-decoration: underline;
  color: var(--primary-600);
}

.info-section {
  margin-top: var(--space-4);
}

.info-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);
}

.info-item:hover {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-sm);
}

.info-item svg {
  width: 20px;
  height: 20px;
  stroke: var(--primary-500);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-text {
  flex: 1;
}

.info-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.info-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: 1.5;
}
</style>

<!-- 全局CSS变量 - 非scoped以确保全局可用 -->
<style>
@import '../styles/variables.css';
@import '../styles/animations.css';
</style>
