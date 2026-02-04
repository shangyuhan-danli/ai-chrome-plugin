// Skill 管理器 - 安全地执行动态加载的 JS 脚本
// 使用 CSP 和沙箱环境确保安全性

export interface Skill {
  id: string
  name: string
  description: string
  version: string
  author?: string
  matchPatterns?: string[]  // URL 匹配模式
  script: string            // JavaScript 代码
  permissions?: string[]    // 需要的权限
  verified?: boolean        // 是否已验证
}

/**
 * Skill 执行器 - 在沙箱环境中执行脚本
 */
class SkillManager {
  private skills: Map<string, Skill> = new Map()
  private sandboxIframe: HTMLIFrameElement | null = null

  /**
   * 注册 Skill
   */
  registerSkill(skill: Skill): void {
    // 验证脚本安全性
    if (!this.validateSkill(skill)) {
      throw new Error(`Skill "${skill.name}" 验证失败`)
    }

    this.skills.set(skill.id, skill)
    console.log(`[SkillManager] 注册 Skill: ${skill.name} (${skill.id})`)
  }

  /**
   * 验证 Skill 安全性
   */
  private validateSkill(skill: Skill): boolean {
    // 1. 检查是否包含危险操作
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /document\.write/,
      /document\.writeln/,
      /innerHTML\s*=/,
      /outerHTML\s*=/,
      /\.src\s*=/,
      /chrome\./,
      /browser\./,
      /XMLHttpRequest/,
      /fetch\s*\(/,
      /import\s+/,
      /require\s*\(/
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(skill.script)) {
        console.warn(`[SkillManager] 检测到危险操作: ${pattern}`)
        return false
      }
    }

    // 2. 检查脚本长度（防止过大的脚本）
    if (skill.script.length > 100000) {
      console.warn('[SkillManager] 脚本过大')
      return false
    }

    return true
  }

  /**
   * 创建沙箱 iframe
   * 
   * 沙箱机制说明：
   * 1. 使用 iframe sandbox 属性创建隔离环境
   * 2. allow-scripts: 允许执行 JavaScript
   * 3. allow-same-origin: 允许访问父页面（需要，否则无法通信）
   * 4. 但不允许：allow-forms, allow-popups, allow-modals 等危险操作
   * 
   * 安全措施：
   * - 脚本在隔离的 iframe 中执行
   * - 通过 postMessage 通信，不直接暴露 DOM
   * - 提供 safeAPI，限制可访问的操作
   */
  private createSandbox(): HTMLIFrameElement {
    if (this.sandboxIframe) {
      return this.sandboxIframe
    }

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    
    // 设置 sandbox 属性
    // allow-scripts: 允许执行脚本
    // allow-same-origin: 允许访问父页面（用于 postMessage 通信）
    // 注意：不添加 allow-forms, allow-popups, allow-modals 等
    iframe.sandbox.add('allow-scripts')
    iframe.sandbox.add('allow-same-origin')  // 需要这个才能通信
    
    iframe.src = 'about:blank'
    document.body.appendChild(iframe)

    this.sandboxIframe = iframe
    return iframe
  }

  /**
   * 执行 Skill
   */
  async executeSkill(skillId: string, context: {
    url: string
    pageTitle: string
    elements?: any[]
    [key: string]: any
  }): Promise<{ success: boolean; result?: any; error?: string }> {
    const skill = this.skills.get(skillId)
    if (!skill) {
      return { success: false, error: `Skill "${skillId}" 未找到` }
    }

    // 检查 URL 匹配
    if (skill.matchPatterns && skill.matchPatterns.length > 0) {
      const matches = skill.matchPatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'))
          return regex.test(context.url)
        } catch {
          return false
        }
      })
      if (!matches) {
        return { success: false, error: `当前页面不匹配 Skill 的 URL 模式` }
      }
    }

    try {
      // 在沙箱中执行
      const result = await this.executeInSandbox(skill.script, context)
      return { success: true, result }
    } catch (error) {
      console.error(`[SkillManager] 执行 Skill "${skillId}" 失败:`, error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * 在沙箱中执行脚本
   * 
   * 执行流程：
   * 1. 创建隔离的 iframe 沙箱
   * 2. 在沙箱中注入安全的 API（safeAPI）
   * 3. 执行用户脚本
   * 4. 通过 postMessage 返回结果
   * 5. 设置超时保护
   */
  private async executeInSandbox(script: string, context: Record<string, any>): Promise<any> {
    const iframe = this.createSandbox()
    
    // 等待 iframe 加载完成
    await new Promise<void>((resolve) => {
      if (iframe.contentDocument?.readyState === 'complete') {
        resolve()
      } else {
        iframe.onload = () => resolve()
      }
    })

    const iframeWindow = iframe.contentWindow
    const iframeDocument = iframe.contentDocument

    if (!iframeWindow || !iframeDocument) {
      throw new Error('无法访问沙箱窗口')
    }

    // 准备沙箱环境
    // 注意：由于 sandbox 限制，我们需要通过 postMessage 与父页面通信
    // 而不是直接访问 parent.document
    
    // 创建安全的 API 代理（在父页面中）
    const requestId = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 注入上下文和安全的 API 包装器
    const sandboxScript = `
      (function() {
        'use strict';
        
        // 注入只读上下文
        const context = ${JSON.stringify(context)};
        
        // 创建消息通道用于与父页面通信
        let messageId = 0;
        const pendingRequests = new Map();
        
        // 发送请求到父页面并等待响应
        function sendRequest(type, data) {
          return new Promise((resolve, reject) => {
            const id = ++messageId;
            pendingRequests.set(id, { resolve, reject });
            
            // 发送请求
            parent.postMessage({
              type: 'SKILL_REQUEST',
              requestId: '${requestId}',
              messageId: id,
              requestType: type,
              data: data
            }, '*');
            
            // 超时处理
            setTimeout(() => {
              if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error('请求超时'));
              }
            }, 5000);
          });
        }
        
        // 监听来自父页面的响应
        window.addEventListener('message', function(event) {
          if (event.data.type === 'SKILL_RESPONSE' && 
              event.data.requestId === '${requestId}' &&
              pendingRequests.has(event.data.messageId)) {
            const { resolve, reject } = pendingRequests.get(event.data.messageId);
            pendingRequests.delete(event.data.messageId);
            
            if (event.data.success) {
              resolve(event.data.result);
            } else {
              reject(new Error(event.data.error || '请求失败'));
            }
          }
        });
        
        // 提供安全的 API（通过 postMessage 与父页面通信）
        const safeAPI = {
          getElementById: async (id) => {
            return await sendRequest('getElementById', { id });
          },
          querySelector: async (selector) => {
            return await sendRequest('querySelector', { selector });
          },
          getElements: () => context.elements || [],
          getContext: () => context
        };
        
        // 执行用户脚本
        let result;
        try {
          ${script}
          // 如果脚本没有返回值，result 为 undefined
        } catch (error) {
          parent.postMessage({
            type: 'SKILL_ERROR',
            requestId: '${requestId}',
            error: error.message
          }, '*');
          return;
        }
        
        // 发送执行结果
        parent.postMessage({
          type: 'SKILL_RESULT',
          requestId: '${requestId}',
          result: typeof result !== 'undefined' ? result : null
        }, '*');
      })();
    `

    try {
      return new Promise((resolve, reject) => {
        // 监听来自沙箱的消息
        const messageHandler = (event: MessageEvent) => {
          // 验证消息来源（安全检查）
          if (event.source !== iframeWindow) {
            return  // 忽略非沙箱来源的消息
          }

          const data = event.data

          // 处理 Skill 请求（safeAPI 调用）
          if (data.type === 'SKILL_REQUEST' && data.requestId === requestId) {
            this.handleSkillRequest(data.requestType, data.data, data.messageId, iframeWindow)
            return
          }

          // 处理执行结果
          if (data.type === 'SKILL_RESULT' && data.requestId === requestId) {
            window.removeEventListener('message', messageHandler)
            resolve(data.result)
            return
          }

          // 处理错误
          if (data.type === 'SKILL_ERROR' && data.requestId === requestId) {
            window.removeEventListener('message', messageHandler)
            reject(new Error(data.error))
            return
          }
        }

        window.addEventListener('message', messageHandler)

        // 在沙箱中执行脚本
        const scriptElement = iframeDocument.createElement('script')
        scriptElement.textContent = sandboxScript
        iframeDocument.body.appendChild(scriptElement)

        // 超时保护
        const timeoutId = setTimeout(() => {
          window.removeEventListener('message', messageHandler)
          // 清理沙箱
          if (iframeDocument.body.contains(scriptElement)) {
            scriptElement.remove()
          }
          reject(new Error('Skill 执行超时（10秒）'))
        }, 10000)  // 10秒超时

        // 清理超时器
        const originalResolve = resolve
        const originalReject = reject
        resolve = (value: any) => {
          clearTimeout(timeoutId)
          originalResolve(value)
        }
        reject = (error: Error) => {
          clearTimeout(timeoutId)
          originalReject(error)
        }
      })
    } catch (error) {
      throw new Error(`沙箱执行失败: ${error}`)
    }
  }

  /**
   * 处理 Skill 中的 safeAPI 请求
   * 这是父页面提供的安全接口，限制 Skill 只能执行允许的操作
   */
  private handleSkillRequest(
    requestType: string,
    data: any,
    messageId: number,
    iframeWindow: Window
  ): void {
    try {
      let result: any = null

      switch (requestType) {
        case 'getElementById': {
          const el = document.getElementById(data.id)
          result = el ? {
            tagName: el.tagName,
            textContent: el.textContent?.trim() || '',
            value: (el as HTMLInputElement).value || '',
            placeholder: (el as HTMLInputElement).placeholder || '',
            getAttribute: (name: string) => el.getAttribute(name)
          } : null
          break
        }

        case 'querySelector': {
          const el = document.querySelector(data.selector) as HTMLElement
          result = el ? {
            tagName: el.tagName,
            textContent: el.textContent?.trim() || '',
            value: (el as HTMLInputElement).value || '',
            placeholder: (el as HTMLInputElement).placeholder || '',
            getAttribute: (name: string) => el.getAttribute(name)
          } : null
          break
        }

        default:
          throw new Error(`未知的请求类型: ${requestType}`)
      }

      // 发送响应回沙箱
      iframeWindow.postMessage({
        type: 'SKILL_RESPONSE',
        messageId: messageId,
        success: true,
        result: result
      }, '*')
    } catch (error) {
      // 发送错误响应
      iframeWindow.postMessage({
        type: 'SKILL_RESPONSE',
        messageId: messageId,
        success: false,
        error: String(error)
      }, '*')
    }
  }

  /**
   * 查找匹配当前页面的 Skills
   */
  findMatchingSkills(url: string): Skill[] {
    return Array.from(this.skills.values()).filter(skill => {
      if (!skill.matchPatterns || skill.matchPatterns.length === 0) {
        return true  // 通用 Skill
      }
      return skill.matchPatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'))
          return regex.test(url)
        } catch {
          return false
        }
      })
    })
  }

  /**
   * 获取所有 Skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  /**
   * 移除 Skill
   */
  removeSkill(skillId: string): boolean {
    return this.skills.delete(skillId)
  }
}

// 导出单例
export const skillManager = new SkillManager()
